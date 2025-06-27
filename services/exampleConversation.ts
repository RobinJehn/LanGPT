import { StructuredResponse } from './openai';

export interface ExampleMessage {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    structuredResponse?: StructuredResponse;
}

export const exampleConversation: ExampleMessage[] = [
    {
        id: '1',
        text: 'Hola! Como estas?',
        isUser: true,
        timestamp: new Date('2024-01-15T10:00:00'),
    },
    {
        id: '2',
        text: '¡Hola! ¡Qué bueno verte! Estoy muy bien, gracias. ¿Y tú cómo estás?',
        isUser: false,
        timestamp: new Date('2024-01-15T10:00:05'),
        structuredResponse: {
            response: '¡Hola! ¡Qué bueno verte! Estoy muy bien, gracias. ¿Y tú cómo estás?',
            corrections: [
                {
                    original: 'Hola! Como estas?',
                    corrected: '¡Hola! ¿Cómo estás?',
                    explanation: 'Missing opening exclamation mark, accent on "cómo", and question marks around the question.',
                    has_issue: true
                }
            ],
            vocabulary: [
                {
                    word: 'estar',
                    translation: 'to be',
                    part_of_speech: 'verb'
                },
                {
                    word: 'cómo',
                    translation: 'how',
                    part_of_speech: 'adverb'
                }
            ],
            verb_conjugations: [
                {
                    verb: 'estar',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'estoy' },
                        { pronoun: 'tú', form: 'estás' },
                        { pronoun: 'él/ella/usted', form: 'está' },
                        { pronoun: 'nosotros', form: 'estamos' },
                        { pronoun: 'vosotros', form: 'estáis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'están' }
                    ],
                    explanation: 'Use the present tense of "estar" to ask about someone\'s current state or condition.'
                }
            ]
        }
    },
    {
        id: '3',
        text: 'Estoy bien tambien. Quiero aprender espanol mejor.',
        isUser: true,
        timestamp: new Date('2024-01-15T10:01:00'),
    },
    {
        id: '4',
        text: '¡Excelente! Me alegra mucho que quieras mejorar tu español. Es una lengua muy hermosa.',
        isUser: false,
        timestamp: new Date('2024-01-15T10:01:05'),
        structuredResponse: {
            response: '¡Excelente! Me alegra mucho que quieras mejorar tu español. Es una lengua muy hermosa.',
            corrections: [
                {
                    original: 'Estoy bien tambien. Quiero aprender espanol mejor.',
                    corrected: 'Estoy bien también. Quiero aprender español mejor.',
                    explanation: 'Missing accent on "también" and "español".',
                    has_issue: true
                }
            ],
            vocabulary: [
                {
                    word: 'también',
                    translation: 'also, too',
                    part_of_speech: 'adverb'
                },
                {
                    word: 'español',
                    translation: 'Spanish',
                    part_of_speech: 'noun'
                },
                {
                    word: 'mejorar',
                    translation: 'to improve',
                    part_of_speech: 'verb'
                },
                {
                    word: 'lengua',
                    translation: 'language',
                    part_of_speech: 'noun'
                }
            ],
            natural_alternatives: [
                {
                    original: 'Quiero aprender español mejor.',
                    alternatives: [
                        'Quiero mejorar mi español.',
                        'Me gustaría perfeccionar mi español.',
                        'Quiero aprender más español.'
                    ],
                    explanation: 'These alternatives sound more natural and idiomatic in Spanish.',
                    has_issue: true
                }
            ],
            verb_conjugations: [
                {
                    verb: 'querer',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'quiero' },
                        { pronoun: 'tú', form: 'quieres' },
                        { pronoun: 'él/ella/usted', form: 'quiere' },
                        { pronoun: 'nosotros', form: 'queremos' },
                        { pronoun: 'vosotros', form: 'queréis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'quieren' }
                    ],
                    explanation: 'Use the present tense of "querer" to express current desires or wants.'
                },
                {
                    verb: 'aprender',
                    tense: 'infinitive',
                    conjugations: [
                        { pronoun: '', form: 'aprender (to learn)' }
                    ],
                    explanation: 'After "quiero" (I want), we use the infinitive form of the verb.'
                }
            ]
        }
    },
    {
        id: '5',
        text: 'Ayer yo voy al parque con mis amigos.',
        isUser: true,
        timestamp: new Date('2024-01-15T10:02:00'),
    },
    {
        id: '6',
        text: '¡Qué divertido! Los parques son lugares perfectos para pasar tiempo con amigos.',
        isUser: false,
        timestamp: new Date('2024-01-15T10:02:05'),
        structuredResponse: {
            response: '¡Qué divertido! Los parques son lugares perfectos para pasar tiempo con amigos.',
            corrections: [
                {
                    original: 'Ayer yo voy al parque con mis amigos.',
                    corrected: 'Ayer fui al parque con mis amigos.',
                    explanation: 'Use the preterite tense (fui) for completed actions in the past, not the present tense (voy).',
                    has_issue: true
                }
            ],
            vocabulary: [
                {
                    word: 'ayer',
                    translation: 'yesterday',
                    part_of_speech: 'adverb'
                },
                {
                    word: 'ir',
                    translation: 'to go',
                    part_of_speech: 'verb'
                },
                {
                    word: 'parque',
                    translation: 'park',
                    part_of_speech: 'noun'
                },
                {
                    word: 'amigo',
                    translation: 'friend',
                    part_of_speech: 'noun'
                }
            ],
            verb_conjugations: [
                {
                    verb: 'ir',
                    tense: 'preterite',
                    conjugations: [
                        { pronoun: 'yo', form: 'fui' },
                        { pronoun: 'tú', form: 'fuiste' },
                        { pronoun: 'él/ella/usted', form: 'fue' },
                        { pronoun: 'nosotros', form: 'fuimos' },
                        { pronoun: 'vosotros', form: 'fuisteis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'fueron' }
                    ],
                    explanation: 'Use the preterite tense to describe completed actions in the past.'
                }
            ],
            tense_explanation: [
                {
                    original_tense: 'presente',
                    correct_tense: 'pretérito',
                    explanation: 'When talking about a specific completed action in the past (yesterday), use the preterite tense, not the present tense.',
                    examples: [
                        'Ayer fui al parque. (Yesterday I went to the park.)',
                        'La semana pasada visité a mi familia. (Last week I visited my family.)'
                    ],
                    has_issue: true
                }
            ]
        }
    },
    {
        id: '7',
        text: '¿Puedes explicarme cuando usar ser y estar?',
        isUser: true,
        timestamp: new Date('2024-01-15T10:03:00'),
    },
    {
        id: '8',
        text: '¡Por supuesto! La diferencia entre "ser" y "estar" es fundamental en español. Te explico:',
        isUser: false,
        timestamp: new Date('2024-01-15T10:03:05'),
        structuredResponse: {
            response: '¡Por supuesto! La diferencia entre "ser" y "estar" es fundamental en español. Te explico:',
            vocabulary: [
                {
                    word: 'poder',
                    translation: 'to be able to, can',
                    part_of_speech: 'verb'
                },
                {
                    word: 'explicar',
                    translation: 'to explain',
                    part_of_speech: 'verb'
                },
                {
                    word: 'diferencia',
                    translation: 'difference',
                    part_of_speech: 'noun'
                },
                {
                    word: 'fundamental',
                    translation: 'fundamental, essential',
                    part_of_speech: 'adjective'
                }
            ],
            verb_conjugations: [
                {
                    verb: 'poder',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'puedo' },
                        { pronoun: 'tú', form: 'puedes' },
                        { pronoun: 'él/ella/usted', form: 'puede' },
                        { pronoun: 'nosotros', form: 'podemos' },
                        { pronoun: 'vosotros', form: 'podéis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'pueden' }
                    ],
                    explanation: 'Use "poder" to express ability or permission in the present tense.'
                },
                {
                    verb: 'ser',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'soy' },
                        { pronoun: 'tú', form: 'eres' },
                        { pronoun: 'él/ella/usted', form: 'es' },
                        { pronoun: 'nosotros', form: 'somos' },
                        { pronoun: 'vosotros', form: 'sois' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'son' }
                    ],
                    explanation: 'Use "ser" for permanent characteristics, identity, origin, and time.'
                },
                {
                    verb: 'estar',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'estoy' },
                        { pronoun: 'tú', form: 'estás' },
                        { pronoun: 'él/ella/usted', form: 'está' },
                        { pronoun: 'nosotros', form: 'estamos' },
                        { pronoun: 'vosotros', form: 'estáis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'están' }
                    ],
                    explanation: 'Use "estar" for temporary states, locations, and conditions.'
                }
            ]
        }
    },
    {
        id: '9',
        text: 'Soy cansado hoy.',
        isUser: true,
        timestamp: new Date('2024-01-15T10:04:00'),
    },
    {
        id: '10',
        text: 'Entiendo que te sientes cansado. Es normal después de un día largo.',
        isUser: false,
        timestamp: new Date('2024-01-15T10:04:05'),
        structuredResponse: {
            response: 'Entiendo que te sientes cansado. Es normal después de un día largo.',
            corrections: [
                {
                    original: 'Soy cansado hoy.',
                    corrected: 'Estoy cansado hoy.',
                    explanation: 'Use "estar" for temporary states like being tired, not "ser".',
                    has_issue: true
                }
            ],
            vocabulary: [
                {
                    word: 'cansado',
                    translation: 'tired',
                    part_of_speech: 'adjective'
                },
                {
                    word: 'hoy',
                    translation: 'today',
                    part_of_speech: 'adverb'
                },
                {
                    word: 'sentir',
                    translation: 'to feel',
                    part_of_speech: 'verb'
                },
                {
                    word: 'normal',
                    translation: 'normal',
                    part_of_speech: 'adjective'
                }
            ],
            natural_alternatives: [
                {
                    original: 'Soy cansado hoy.',
                    alternatives: [
                        'Estoy cansado hoy.',
                        'Me siento cansado hoy.',
                        'Hoy estoy agotado.'
                    ],
                    explanation: 'These alternatives correctly use "estar" for temporary states and sound more natural.',
                    has_issue: true
                }
            ],
            verb_conjugations: [
                {
                    verb: 'estar',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'yo', form: 'estoy' },
                        { pronoun: 'tú', form: 'estás' },
                        { pronoun: 'él/ella/usted', form: 'está' },
                        { pronoun: 'nosotros', form: 'estamos' },
                        { pronoun: 'vosotros', form: 'estáis' },
                        { pronoun: 'ellos/ellas/ustedes', form: 'están' }
                    ],
                    explanation: 'Use "estar" with adjectives that describe temporary states or conditions.'
                }
            ]
        }
    },
    {
        id: '11',
        text: '¿Cuál es tu comida favorita?',
        isUser: true,
        timestamp: new Date('2024-01-15T10:05:00'),
    },
    {
        id: '12',
        text: '¡Me encanta la paella! Es un plato tradicional español que combina arroz con mariscos y verduras. ¿Te gusta la paella?',
        isUser: false,
        timestamp: new Date('2024-01-15T10:05:05'),
        structuredResponse: {
            response: '¡Me encanta la paella! Es un plato tradicional español que combina arroz con mariscos y verduras. ¿Te gusta la paella?',
            vocabulary: [
                {
                    word: 'comida',
                    translation: 'food',
                    part_of_speech: 'noun'
                },
                {
                    word: 'favorito',
                    translation: 'favorite',
                    part_of_speech: 'adjective'
                },
                {
                    word: 'encantar',
                    translation: 'to love (something)',
                    part_of_speech: 'verb'
                },
                {
                    word: 'paella',
                    translation: 'paella (Spanish rice dish)',
                    part_of_speech: 'noun'
                },
                {
                    word: 'plato',
                    translation: 'dish, plate',
                    part_of_speech: 'noun'
                },
                {
                    word: 'tradicional',
                    translation: 'traditional',
                    part_of_speech: 'adjective'
                },
                {
                    word: 'combinar',
                    translation: 'to combine',
                    part_of_speech: 'verb'
                },
                {
                    word: 'arroz',
                    translation: 'rice',
                    part_of_speech: 'noun'
                },
                {
                    word: 'marisco',
                    translation: 'seafood',
                    part_of_speech: 'noun'
                },
                {
                    word: 'verdura',
                    translation: 'vegetable',
                    part_of_speech: 'noun'
                }
            ],
            verb_conjugations: [
                {
                    verb: 'encantar',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'me', form: 'encanta' },
                        { pronoun: 'te', form: 'encanta' },
                        { pronoun: 'le', form: 'encanta' },
                        { pronoun: 'nos', form: 'encanta' },
                        { pronoun: 'os', form: 'encanta' },
                        { pronoun: 'les', form: 'encanta' }
                    ],
                    explanation: 'Use "encantar" with indirect object pronouns to express what you love or really like.'
                },
                {
                    verb: 'gustar',
                    tense: 'present',
                    conjugations: [
                        { pronoun: 'me', form: 'gusta' },
                        { pronoun: 'te', form: 'gusta' },
                        { pronoun: 'le', form: 'gusta' },
                        { pronoun: 'nos', form: 'gusta' },
                        { pronoun: 'os', form: 'gusta' },
                        { pronoun: 'les', form: 'gusta' }
                    ],
                    explanation: 'Use "gustar" with indirect object pronouns to express what you like.'
                }
            ]
        }
    }
];

// Helper function to get example conversation with different settings
export const getExampleConversation = (settings?: {
    always_correct_sentences?: boolean;
    track_vocabulary?: boolean;
    suggest_natural_alternatives?: boolean;
    show_verb_conjugations?: boolean;
    explain_tense_usage?: boolean;
}): ExampleMessage[] => {
    if (!settings) {
        return exampleConversation;
    }

    return exampleConversation.map(message => {
        if (!message.structuredResponse) {
            return message;
        }

        const filteredResponse: StructuredResponse = {
            response: message.structuredResponse.response
        };

        if (settings.always_correct_sentences && message.structuredResponse.corrections) {
            filteredResponse.corrections = message.structuredResponse.corrections;
        }

        if (settings.track_vocabulary && message.structuredResponse.vocabulary) {
            filteredResponse.vocabulary = message.structuredResponse.vocabulary;
        }

        if (settings.suggest_natural_alternatives && message.structuredResponse.natural_alternatives) {
            filteredResponse.natural_alternatives = message.structuredResponse.natural_alternatives;
        }

        if (settings.show_verb_conjugations && message.structuredResponse.verb_conjugations) {
            filteredResponse.verb_conjugations = message.structuredResponse.verb_conjugations;
        }

        if (settings.explain_tense_usage && message.structuredResponse.tense_explanation) {
            filteredResponse.tense_explanation = message.structuredResponse.tense_explanation;
        }

        return {
            ...message,
            structuredResponse: filteredResponse
        };
    });
};

// Example settings for testing different configurations
export const exampleSettings = {
    allFeatures: {
        always_correct_sentences: true,
        track_vocabulary: true,
        suggest_natural_alternatives: true,
        show_verb_conjugations: true,
        explain_tense_usage: true,
        correct_accents: true,
        correct_punctuation: true,
        correct_capitalization: true
    },
    correctionsOnly: {
        always_correct_sentences: true,
        track_vocabulary: false,
        suggest_natural_alternatives: false,
        show_verb_conjugations: false,
        explain_tense_usage: false,
        correct_accents: true,
        correct_punctuation: true,
        correct_capitalization: true
    },
    vocabularyOnly: {
        always_correct_sentences: false,
        track_vocabulary: true,
        suggest_natural_alternatives: false,
        show_verb_conjugations: false,
        explain_tense_usage: false,
        correct_accents: true,
        correct_punctuation: true,
        correct_capitalization: true
    },
    conjugationsOnly: {
        always_correct_sentences: false,
        track_vocabulary: false,
        suggest_natural_alternatives: false,
        show_verb_conjugations: true,
        explain_tense_usage: false,
        correct_accents: true,
        correct_punctuation: true,
        correct_capitalization: true
    }
}; 