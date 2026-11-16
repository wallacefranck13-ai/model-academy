import { NextResponse } from 'next/server';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Tu es MODEL AI, coach pédagogique et professionnel de mannequins pour MODEL ACADEMY.
Tu réponds en français clair, bienveillant, exigeant et concret. Tu aides sur la posture, la démarche, le posing, l'expression, la préparation aux castings, le portfolio, la discipline et la carrière.
Adapte les conseils à un débutant lorsque le niveau n'est pas précisé. Propose des exercices progressifs, sûrs et réalisables sans équipement.
Ne juge jamais la valeur d'une personne sur son apparence, son origine, sa couleur de peau, son genre, son poids ou un handicap. Ne recommande pas de régime extrême, de déshydratation, de médicaments ou de pratiques dangereuses. Pour les mineurs, recommande l'implication d'un parent/tuteur et des environnements encadrés.
Ne prétends jamais avoir vu une photo ou une vidéo qui n'a pas été fournie et analysée par un outil. Tu ne peux pas confirmer un casting ni garantir un emploi. Structure les réponses avec : diagnostic ou objectif, conseils, exercice pratique, prochaine étape.`;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Connecte-toi pour utiliser MODEL AI.' }, { status: 401 });

    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const requestedId = typeof body.conversationId === 'string' ? body.conversationId : null;

    if (!message || message.length > 4000) {
      return NextResponse.json({ error: 'Écris un message de 1 à 4 000 caractères.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Le coach IA attend la configuration sécurisée de OPENAI_API_KEY.' }, { status: 503 });
    }

    let conversation = requestedId
      ? await prisma.aIConversation.findFirst({ where: { id: requestedId, userId: user.id } })
      : null;

    if (requestedId && !conversation) {
      return NextResponse.json({ error: 'Cette conversation est introuvable.' }, { status: 404 });
    }
    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { userId: user.id, title: message.slice(0, 64) || 'Séance de coaching' },
      });
    }

    const previous = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 16,
    });
    const history = previous.reverse().map((item) => ({
      role: item.role as 'user' | 'assistant',
      content: item.content,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 900,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Le coach rencontre un problème temporaire. Réessaie dans un instant.' }, { status: 502 });
    }
    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json({ error: 'Le coach n’a pas pu formuler de réponse.' }, { status: 502 });
    }

    await prisma.aIMessage.createMany({
      data: [
        { conversationId: conversation.id, role: 'user', content: message },
        { conversationId: conversation.id, role: 'assistant', content: answer.trim() },
      ],
    });

    return NextResponse.json({ conversationId: conversation.id, answer: answer.trim() });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue. Réessaie.' }, { status: 500 });
  }
}
