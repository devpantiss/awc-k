export type EcceDomain =
  | 'Cognitive Development'
  | 'Language & Communication'
  | 'Physical Development'
  | 'Social & Emotional Development'
  | 'Creative & Aesthetic Development';

export type EcceStatus = 'Not Started' | 'In Progress' | 'Completed';

export type EcceSection = 'foundations' | 'monthly';

export interface EcceActivity {
  id: string;
  name: string;
  completed: boolean;
}

export interface EcceModule {
  id: string;
  section: EcceSection;
  month?: number;
  title: string;
  domains: EcceDomain[];
  description: string;
  activities: EcceActivity[];
  learningOutcomes: string[];
  indicators: string[];
}

export const ecceDomains: EcceDomain[] = [
  'Cognitive Development',
  'Language & Communication',
  'Physical Development',
  'Social & Emotional Development',
  'Creative & Aesthetic Development',
];

const foundationTopics: Array<Omit<EcceModule, 'section' | 'activities' | 'learningOutcomes' | 'indicators'> & { activitySeed: string }> = [
  { id: 'foundation-early-childhood', title: 'Importance of Early Childhood', domains: ['Cognitive Development', 'Social & Emotional Development'], description: 'Why the early years are the most sensitive period for brain, language, health, and habit formation.', activitySeed: 'Discuss early years needs' },
  { id: 'foundation-general-info', title: 'General Information', domains: ['Language & Communication'], description: 'Basic orientation to Anganwadi ECCE routines, child records, classroom rhythm, and caregiver communication.', activitySeed: 'Review child records' },
  { id: 'foundation-objectives', title: 'Objectives of Preschool Education', domains: ecceDomains, description: 'Readiness for school through play, social participation, language, early numeracy, creativity, and independence.', activitySeed: 'Map objectives to activities' },
  { id: 'foundation-utility', title: 'Importance & Utility of ECCE', domains: ['Cognitive Development', 'Social & Emotional Development'], description: 'How ECCE improves attendance, confidence, curiosity, health practices, and smooth transition to primary school.', activitySeed: 'Create ECCE use cases' },
  { id: 'foundation-workbook', title: 'Workbook Instructions', domains: ['Language & Communication', 'Creative & Aesthetic Development'], description: 'Guidance for using workbooks as joyful reinforcement after concrete play and conversation.', activitySeed: 'Plan workbook follow-up' },
  { id: 'foundation-holistic', title: 'Holistic Child Development Dimensions', domains: ecceDomains, description: 'Integrated development across body, language, thinking, emotions, relationships, imagination, and values.', activitySeed: 'Observe five domains' },
  { id: 'foundation-child-nature', title: 'Nature of Children in Anganwadi', domains: ['Social & Emotional Development', 'Language & Communication'], description: 'Children learn through movement, imitation, repetition, curiosity, peer play, songs, stories, and sensory exploration.', activitySeed: 'Note child learning styles' },
  { id: 'foundation-dos-donts', title: 'Do\'s and Don\'ts in Anganwadi Teaching', domains: ['Social & Emotional Development'], description: 'Positive guidance, inclusive language, safety, encouragement, and avoiding fear, comparison, punishment, or rote pressure.', activitySeed: 'Sort teaching practices' },
  { id: 'foundation-theme-content', title: 'Theme-based ECCE Content', domains: ['Cognitive Development', 'Language & Communication'], description: 'Using familiar monthly themes to connect vocabulary, concepts, stories, art, movement, and local knowledge.', activitySeed: 'Link theme vocabulary' },
  { id: 'foundation-activity-details', title: 'ECCE Activity Details', domains: ecceDomains, description: 'Activity structure with objective, material, group process, questions, adaptations, and observation points.', activitySeed: 'Write an activity card' },
  { id: 'foundation-indicators', title: 'Age-Appropriate Development Indicators', domains: ecceDomains, description: 'Observable indicators for tracking readiness without labeling or pressuring children.', activitySeed: 'Match indicators to age' },
  { id: 'foundation-kit', title: 'Pre-School Kit', domains: ['Cognitive Development', 'Physical Development', 'Creative & Aesthetic Development'], description: 'Use blocks, beads, puzzles, puppets, cards, picture books, balls, and art material purposefully.', activitySeed: 'Organize kit materials' },
  { id: 'foundation-corners', title: 'Anganwadi Learning Corners', domains: ecceDomains, description: 'Book, block, pretend-play, art, discovery, and manipulative corners for self-directed play.', activitySeed: 'Set up learning corners' },
  { id: 'foundation-low-cost-material', title: 'Low-cost Learning Material Preparation', domains: ['Creative & Aesthetic Development', 'Cognitive Development'], description: 'Prepare safe, local, low-cost TLM using seeds, leaves, boxes, cloth, bottle caps, cards, and picture cutouts.', activitySeed: 'Make local TLM' },
  { id: 'foundation-monthly-planning', title: 'Monthly Planning Strategy', domains: ['Cognitive Development', 'Language & Communication'], description: 'Plan monthly concepts, vocabulary, songs, stories, games, art, assessment, and parent connection.', activitySeed: 'Draft monthly plan' },
  { id: 'foundation-activity-planning', title: 'Activity Planning', domains: ecceDomains, description: 'Convert themes into daily balanced activities across domains, group sizes, and age levels.', activitySeed: 'Create daily activity flow' },
  { id: 'foundation-weekly-schedule', title: 'Weekly Schedule', domains: ecceDomains, description: 'Balanced weekly rhythm for free play, circle time, outdoor play, stories, art, readiness activities, and review.', activitySeed: 'Build weekly timetable' },
  { id: 'foundation-songs', title: 'Songs: Morning Prayer, Welcome Song, Birthday Song', domains: ['Language & Communication', 'Social & Emotional Development', 'Creative & Aesthetic Development'], description: 'Songs and rhymes for belonging, memory, vocabulary, rhythm, confidence, and joyful routine.', activitySeed: 'Practice action songs' },
  { id: 'foundation-anthem', title: 'National Anthem & Utkala Bandana', domains: ['Language & Communication', 'Social & Emotional Development'], description: 'Respectful participation in shared cultural songs through listening, posture, pronunciation, and meaning.', activitySeed: 'Practice group singing' },
];

const monthlyTopics: Array<Pick<EcceModule, 'id' | 'month' | 'title' | 'domains' | 'description'> & { seeds: string[] }> = [
  { id: 'month-1', month: 1, title: 'Me and My Family', domains: ['Social & Emotional Development', 'Language & Communication', 'Creative & Aesthetic Development'], description: 'Children talk about self, family members, relationships, home roles, care, and belonging.', seeds: ['Introduce family members', 'Draw my family', 'Role-play helping at home'] },
  { id: 'month-2', month: 2, title: 'My Body', domains: ['Physical Development', 'Language & Communication', 'Cognitive Development'], description: 'Body parts, senses, hygiene, safety, movement, healthy habits, and self-help routines.', seeds: ['Name body parts', 'Action game with senses', 'Handwashing practice'] },
  { id: 'month-3', month: 3, title: 'Animals and Birds', domains: ['Cognitive Development', 'Language & Communication', 'Creative & Aesthetic Development'], description: 'Local animals, birds, sounds, homes, food, care, classification, and observation.', seeds: ['Animal sound circle', 'Sort animals and birds', 'Make a paper bird'] },
  { id: 'month-4', month: 4, title: 'Trees, Flowers, Fruits', domains: ['Cognitive Development', 'Physical Development', 'Creative & Aesthetic Development'], description: 'Plants, parts of a tree, fruits, flowers, seeds, colors, textures, care for nature, and healthy food.', seeds: ['Leaf texture rubbing', 'Fruit color sorting', 'Water a plant'] },
  { id: 'month-5', month: 5, title: 'House & Household Items', domains: ['Cognitive Development', 'Language & Communication', 'Social & Emotional Development'], description: 'Rooms, utensils, furniture, safe use of household objects, and cooperation in family routines.', seeds: ['Name household items', 'Match item to room', 'Pretend kitchen play'] },
  { id: 'month-6', month: 6, title: 'Transport', domains: ['Cognitive Development', 'Language & Communication', 'Physical Development'], description: 'Land, water, and air transport, road safety, sounds, movement, counting vehicles, and local travel.', seeds: ['Sort transport modes', 'Traffic signal game', 'Make a paper boat'] },
  { id: 'month-7', month: 7, title: 'Community Helpers', domains: ['Social & Emotional Development', 'Language & Communication', 'Cognitive Development'], description: 'Helpers in the community, their tools, services, respect for work, and asking for help safely.', seeds: ['Helper role-play', 'Match helper tools', 'Thank-you card'] },
  { id: 'month-8', month: 8, title: 'Occupations & Institutions', domains: ['Social & Emotional Development', 'Cognitive Development', 'Language & Communication'], description: 'Local occupations, school, health centre, post office, market, panchayat, and public places.', seeds: ['Institution picture talk', 'Occupation action game', 'Market visit pretend play'] },
  { id: 'month-9', month: 9, title: 'Insects & Reptiles', domains: ['Cognitive Development', 'Physical Development', 'Language & Communication'], description: 'Common insects and reptiles, movement, habitats, safety, observation, and care for living things.', seeds: ['Observe insects safely', 'Crawl and slither movement', 'Sort safe and unsafe'] },
  { id: 'month-10', month: 10, title: 'Soil, Water, Air', domains: ['Cognitive Development', 'Physical Development', 'Creative & Aesthetic Development'], description: 'Natural elements through sensory play, floating, sinking, wet/dry, clean water, air movement, and conservation.', seeds: ['Float and sink play', 'Soil texture tray', 'Make a paper fan'] },
  { id: 'month-11', month: 11, title: 'Seasons', domains: ['Cognitive Development', 'Language & Communication', 'Creative & Aesthetic Development'], description: 'Weather, seasonal clothes, food, festivals, changes in nature, and daily care in different seasons.', seeds: ['Weather chart', 'Dress for season', 'Season song'] },
  { id: 'month-12', month: 12, title: 'Sun, Moon, Stars', domains: ['Cognitive Development', 'Language & Communication', 'Creative & Aesthetic Development'], description: 'Day and night, sky objects, shadows, time routines, wonder, stories, songs, and art.', seeds: ['Day-night sorting', 'Shadow play', 'Star collage'] },
];

function buildActivities(moduleId: string, seeds: string[]): EcceActivity[] {
  return seeds.map((name, index) => ({
    id: `${moduleId}-activity-${index + 1}`,
    name,
    completed: false,
  }));
}

export const ecceCurriculum: EcceModule[] = [
  ...foundationTopics.map((topic) => ({
    ...topic,
    section: 'foundations' as const,
    activities: buildActivities(topic.id, [
      topic.activitySeed,
      'Connect with classroom practice',
      'Record child observation notes',
    ]),
    learningOutcomes: [
      'Anganwadi worker can plan child-centred ECCE experiences.',
      'Children receive safe, inclusive, play-based learning support.',
      'Daily practice is connected with observation and family context.',
    ],
    indicators: [
      'Uses warm, encouraging language with children.',
      'Plans activities for more than one development domain.',
      'Records simple observations without labeling children.',
    ],
  })),
  ...monthlyTopics.map((topic) => ({
    ...topic,
    section: 'monthly' as const,
    activities: buildActivities(topic.id, topic.seeds),
    learningOutcomes: [
      `Children build vocabulary and concepts around ${topic.title.toLowerCase()}.`,
      'Children participate in play, conversation, movement, art, and group routines.',
      'Children connect classroom learning with familiar local experiences.',
    ],
    indicators: [
      'Names familiar objects, people, actions, or features from the theme.',
      'Participates in group activity with increasing confidence.',
      'Shows curiosity through questions, sorting, drawing, movement, or pretend play.',
    ],
  })),
];
