import { NextResponse } from 'next/server';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export const runtime = 'nodejs';

const FOCUS: Record<string, string> = {
  WALK: 'la démarche, la coordination générale et la présentation en marche',
  POSTURE: 'la posture visible, l’alignement apparent et la stabilité',
  POSING: 'la variété des poses, les lignes corporelles et les transitions visibles',
  EXPRESSION: 'l’expression faciale visible et la présence face à la caméra',
  CASTING: 'la présentation face caméra et la clarté de la présentation',
  GENERAL: 'la présentation générale et les bases du mannequinat',
};

function validImage(value: unknown): value is string {
  return typeof value === 'string'
    && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)
    && value.length < 450_000;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Connecte-toi pour analyser ta séance.' }, { status: 401 });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Le moteur de vision n’est pas encore configuré sur le serveur.' }, { status: 503 });
    }

    const body = await request.json();
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    const frames = body.frames;
    if (!sessionId || !Array.isArray(frames) || frames.length !== 3 || !frames.every(validImage)) {
      return NextResponse.json({ error: 'Trois images clés valides sont nécessaires pour cette analyse.' }, { status: 400 });
    }

    const session = await prisma.aITrainingSession.findFirst({
      where: { id: sessionId, userId: user.id },
      select: { id: true, sessionType: true },
    });
    if (!session) return NextResponse.json({ error: 'Séance introuvable.' }, { status: 404 });

    const focus = FOCUS[session.sessionType] || FOCUS.GENERAL;
    const instruction = `Tu es MODEL AI VISION, un assistant pédagogique de mannequinat. Tu examines exactement trois images fixes extraites d'une vidéo. L'objectif déclaré est : ${focus}.
Réponds en français et uniquement avec un objet JSON valide contenant les clés :
"summary" (2 phrases maximum, observations prudentes),
"visibleStrengths" (tableau de 2 à 3 points),
"improvements" (tableau de 2 à 3 points),
"exercises" (tableau de 2 à 3 exercices concrets, progressifs et sûrs),
"confidenceNote" (une phrase sur les limites de l'observation).
N'invente aucun mouvement, aucune mesure biomécanique, aucun score corporel, aucune caractéristique personnelle. Tu ne vois que trois images fixes, pas le mouvement continu. Ne juge pas l'attractivité, le poids, l'origine, la couleur de peau, le genre ou le handicap. Ne recommande jamais de régime, de perte de poids, de déshydratation ou de pratique dangereuse. Si les images ne montrent pas suffisamment la personne ou l'exercice, dis-le clairement et recommande un nouvel enregistrement cadré en pied, dans un espace dégagé et bien éclairé. Sois encourageant, précis, respectueux et non médical.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 850,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: instruction },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyse ces trois images clés de ma séance. Fais des observations uniquement à partir de ce qui est visible.' },
              ...frames.map((image_url: string) => ({ type: 'image_url', image_url: { url: image_url, detail: 'low' } })),
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Le moteur de vision est momentanément indisponible. Ta vidéo reste enregistrée.' }, { status: 502 });
    }
    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content;
    let feedback: Record<string, unknown>;
    try {
      feedback = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Le rapport n’a pas pu être interprété. Ta vidéo reste enregistrée.' }, { status: 502 });
    }

    await prisma.aITrainingSession.update({
      where: { id: session.id },
      data: { status: 'ANALYZED_KEY_FRAMES', feedback: feedback as object },
    });

    return NextResponse.json({ feedback, sessionId: session.id });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue pendant l’analyse.' }, { status: 500 });
  }
}
