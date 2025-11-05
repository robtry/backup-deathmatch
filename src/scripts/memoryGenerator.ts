/**
 * Procedural memory generator for diverse, non-clichéd memories
 * Combines random parts to create unique narrative fragments
 * Optimized for grammatical coherence - all combinations make sense
 */

// Días
const days = ['3', '7', '12', '15', '23', '28', '31'];

// Meses
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Años variados
const years = ['2077', '2134', '2089', '3021', '2156', '2999', '2203'];

// Horas
const hours = ['3:42 AM', '7:15 PM', '11:33 PM', '2:08 AM', '9:47 PM', '4:56 AM', '10:22 PM', '6:13 AM'];

// Marcos temporales (sin repetitivos)
const timeFrames = [
  // Fechas específicas
  () => `El ${random(days)} de ${random(months)}`,
  () => `El ${random(days)} de ${random(months)} del ${random(years)}`,
  // Horas específicas
  () => `A las ${random(hours)}`,
  // Eventos
  () => 'Cuando todo colapsó',
  () => 'Durante el apagón',
  () => `El día ${random(['17', '42', '99', '127', '256', '341', '512'])}`,
  () => `Hace ${random(['dos', 'tres', 'siete', 'doce'])} ciclos`,
  () => `El ${random(['lunes', 'martes', 'jueves', 'viernes'])}`,
];

// Verbos transitivos (con objeto directo)
const transitiveVerbs = [
  'destruiste',
  'construiste',
  'robaste',
  'vendiste',
  'compraste',
  'encontraste',
  'perdiste',
  'mataste a',
  'salvaste a',
  'traicionaste a',
  'besaste a',
  'curaste a',
  'infectaste',
  'programaste',
  'hackeaste',
  'clonaste',
  'descubriste',
  'olvidaste',
  'recordaste',
  'devoraste',
];

// Verbos con preposición "a" (aprender a, intentar...)
const infinitiveVerbs = [
  'aprendiste a',
  'intentaste',
  'lograste',
  'te negaste a',
  'decidiste',
  'planeaste',
  'necesitaste',
  'quisiste',
];

// Verbos con preposición "con"
const withVerbs = [
  'hablaste con',
  'negociaste con',
  'peleaste con',
  'te fusionaste con',
  'compartiste con',
  'conspiraste con',
];

// Objetos/Personas (objetos directos)
const objects = [
  'la IA dormida',
  'el último humano',
  'los dinosaurios sintéticos',
  'tu clon defectuoso',
  'las hormigas rebeldes',
  'el algoritmo consciente',
  'tu yo de otra dimensión',
  'el androide oxidado',
  'la colmena central',
  'los datos corrompidos',
  'tu familia digital',
  'el virus emocional',
  'las nanomáquinas',
  'el reactor cuántico',
  'los recuerdos ajenos',
  'la ciudad sumergida',
  'el proyecto cancelado',
  'la señal extraterrestre',
  'tu consciencia respaldada',
  'el glitch del sistema',
  'los restos del convoy',
  'la biblioteca prohibida',
  'el espécimen 7',
  'las ruinas del servidor',
  'el portal cerrado',
];

// Acciones infinitivas (para verbos tipo "aprendiste a...")
const infinitives = [
  'dominar el mundo',
  'escapar del búnker',
  'pilotar naves',
  'hackear la matriz',
  'respirar metano',
  'ver en ultravioleta',
  'comer plástico',
  'hablar binario',
  'teletransportarte',
  'leer mentes',
  'generar antimateria',
  'detener el tiempo',
  'crear vida sintética',
  'sobrevivir al vacío',
  'descifrar el código',
  'romper el bucle',
  'cruzar al otro lado',
  'reescribir tu ADN',
  'fusionarte',
  'dividirte en tres',
  'olvidar tu nombre',
  'despertar del sueño',
  'morir lentamente',
  'renacer digital',
  'trascender lo físico',
];

// Lugares (para verbos de movimiento)
const places = [
  'la zona prohibida',
  'el núcleo del reactor',
  'la superficie de Marte',
  'el servidor central',
  'las ruinas subterráneas',
  'el vacío cuántico',
  'la última colonia',
  'el punto de no retorno',
  'la dimensión espejo',
  'el búnker 7',
];

// Conectores narrativos
const connectors = [
  'pero',
  'y entonces',
  'así fue como',
  'hasta que',
  'justo cuando',
  'aunque',
  'sin embargo',
  'de repente',
  'inevitablemente',
  'por accidente',
  'según el plan',
  'contra todo pronóstico',
];

// Consecuencias (verbos en pasado)
const consequences = [
  'conociste el vacío',
  'perdiste la cordura',
  'ganaste la partida',
  'te convertiste en leyenda',
  'desapareciste del registro',
  'fusionaste las realidades',
  'rompiste el protocolo',
  'activaste la secuencia',
  'detuviste la propagación',
  'iniciaste el colapso',
  'te sincronizaste',
  'perdiste la señal',
  'encontraste la salida',
  'cerraste el ciclo',
  'abriste la compuerta',
  'liberaste el código',
  'sellaste el pacto',
  'rechazaste la oferta',
  'completaste la misión',
  'fallaste el protocolo',
];

/**
 * Generates a random memory using grammatically correct template combinations
 * All patterns guarantee syntactic coherence
 */
export function generateRandomMemory(): string {
  // Helper to get a time frame (now they're functions)
  const getTimeFrame = () => random(timeFrames)();

  const patterns = [
    // Pattern 1: [time] + [transitive verb] + [object]
    () => `${getTimeFrame()} ${random(transitiveVerbs)} ${random(objects)}`,

    // Pattern 2: [time] + [infinitive verb] + [infinitive action]
    () => `${getTimeFrame()} ${random(infinitiveVerbs)} ${random(infinitives)}`,

    // Pattern 3: [time] + [with verb] + [object]
    () => `${getTimeFrame()} ${random(withVerbs)} ${random(objects)}`,

    // Pattern 4: [time] + [transitive verb] + [object] + [connector] + [consequence]
    () => `${getTimeFrame()} ${random(transitiveVerbs)} ${random(objects)} ${random(connectors)} ${random(consequences)}`,

    // Pattern 5: [time] + [infinitive verb] + [infinitive] + [connector] + [consequence]
    () => `${getTimeFrame()} ${random(infinitiveVerbs)} ${random(infinitives)} ${random(connectors)} ${random(consequences)}`,

    // Pattern 6: [object] + te obligó a + [infinitive]
    () => `${random(objects)} te obligó a ${random(infinitives)}`,

    // Pattern 7: [object] + te obligó a + [infinitive] + [connector] + [consequence]
    () => `${random(objects)} te obligó a ${random(infinitives)} ${random(connectors)} ${random(consequences)}`,

    // Pattern 8: Viajaste a + [place]
    () => `${getTimeFrame()} viajaste a ${random(places)}`,

    // Pattern 9: Viajaste a + [place] + [connector] + [consequence]
    () => `${getTimeFrame()} viajaste a ${random(places)} ${random(connectors)} ${random(consequences)}`,

    // Pattern 10: Simple consequence
    () => `${getTimeFrame()} ${random(consequences)}`,
  ];

  const selectedPattern = random(patterns);
  return selectedPattern();
}

/**
 * Generates a pool of unique random memories
 */
export function generateMemoryPool(count: number = 80): string[] {
  const memories = new Set<string>();

  // Generate until we have enough unique memories
  while (memories.size < count) {
    memories.add(generateRandomMemory());
  }

  return Array.from(memories);
}

// Helper function
function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
