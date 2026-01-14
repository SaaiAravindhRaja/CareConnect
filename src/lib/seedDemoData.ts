import { supabase } from './supabase';

/**
 * Seeds demo data for Maria Santos (caregiver) and Mr. Chen Wei Lin (care recipient)
 * Creates 2 weeks of realistic interactions, preferences, and suggestions
 * Idempotent: Checks if demo data already exists before creating
 */
export async function seedDemoData(userId: string, caregiverId: string) {
  try {
    console.log('🌱 Checking for existing demo data...');

    // Check if Mr. Chen Wei Lin already exists for this user
    const { data: existingRecipient, error: checkError } = await supabase
      .from('care_recipients')
      .select('id')
      .eq('created_by', userId)
      .eq('name', 'Mr. Chen Wei Lin')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing data:', checkError);
    }

    if (existingRecipient) {
      console.log('✅ Demo data already exists, skipping seed');
      return { success: true, recipient: existingRecipient, alreadyExists: true };
    }

    console.log('🌱 Seeding demo data...');

    // 1. Create Mr. Chen Wei Lin (care recipient)
    const { data: recipient, error: recipientError } = await supabase
      .from('care_recipients')
      .insert({
        name: 'Mr. Chen Wei Lin',
        age: 78,
        communication_style: 'Prefers gentle, patient tone. Responds well to reminiscing about his music teaching days.',
        important_notes: 'Former music teacher. Loves classical music, especially Bach. Morning person - most alert 8-11am. Sometimes forgets recent events but remembers music perfectly.',
        created_by: userId,
      })
      .select()
      .single();

    if (recipientError) throw recipientError;
    console.log('✅ Created Mr. Chen');

    // 2. Create care relationship
    const { error: relationError } = await supabase
      .from('care_relationships')
      .insert({
        caregiver_id: caregiverId,
        recipient_id: recipient.id,
        relationship_type: 'primary',
      });

    if (relationError) throw relationError;
    console.log('✅ Created care relationship');

    // 3. Create interactions over 2 weeks (oldest to newest)
    const now = new Date();
    const interactions = [
      // Week 1
      {
        days_ago: 14,
        activity_type: 'conversation',
        title: 'Morning chat about his teaching days',
        description: 'Mr. Chen shared memories about teaching violin to children. His face lit up when talking about a particularly talented student who became a professional musician.',
        mood_rating: 4,
        success_level: 4,
        energy_level: 4,
        tags: ['memory', 'music', 'morning', 'happy'],
      },
      {
        days_ago: 13,
        activity_type: 'activity',
        title: 'Listened to Bach concertos',
        description: 'Played Bach\'s Brandenburg Concertos. Mr. Chen hummed along and tapped his fingers on the armrest. He correctly identified Concerto No. 3.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 3,
        tags: ['music', 'bach', 'classical', 'afternoon'],
      },
      {
        days_ago: 12,
        activity_type: 'meal',
        title: 'Breakfast together',
        description: 'He enjoyed congee with preserved egg. Ate well and chatted about his wife\'s cooking. Mentioned she used to make this for him every Sunday.',
        mood_rating: 4,
        success_level: 4,
        energy_level: 4,
        tags: ['food', 'family', 'morning'],
      },
      {
        days_ago: 11,
        activity_type: 'outing',
        title: 'Walk in the garden',
        description: 'Short 15-minute walk around the facility garden. Mr. Chen noticed the birds singing and said they reminded him of morning rehearsals with his students.',
        mood_rating: 4,
        success_level: 3,
        energy_level: 3,
        tags: ['outdoors', 'exercise', 'morning', 'nature'],
      },
      {
        days_ago: 10,
        activity_type: 'activity',
        title: 'Looked through photo albums',
        description: 'Went through old family photos. He got emotional seeing pictures of his late wife but smiled remembering their wedding day. Spent 30 minutes reminiscing.',
        mood_rating: 3,
        success_level: 4,
        energy_level: 3,
        tags: ['family', 'photos', 'memory', 'afternoon'],
      },
      {
        days_ago: 9,
        activity_type: 'relaxation',
        title: 'Afternoon tea time',
        description: 'Had Chinese tea and some biscuits. Quiet, peaceful moment. Mr. Chen seemed content just sitting and watching the birds outside.',
        mood_rating: 4,
        success_level: 4,
        energy_level: 2,
        tags: ['calm', 'afternoon', 'tea'],
      },
      {
        days_ago: 8,
        activity_type: 'activity',
        title: 'Listened to violin sonatas',
        description: 'Played Beethoven violin sonatas. Mr. Chen became animated, explaining the technique required. He mimed playing the violin and hummed the melody.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 4,
        tags: ['music', 'classical', 'violin', 'morning', 'lively'],
      },

      // Week 2
      {
        days_ago: 7,
        activity_type: 'conversation',
        title: 'Talking about Singapore in the 1960s',
        description: 'Mr. Chen shared stories about teaching at a local school when Singapore just became independent. Very engaged and animated throughout.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 4,
        tags: ['memory', 'history', 'morning', 'storytelling'],
      },
      {
        days_ago: 6,
        activity_type: 'meal',
        title: 'Lunch with favorite dishes',
        description: 'Made his favorite: steamed fish with soy sauce. He ate everything and asked for seconds. Mentioned his mother used to cook fish this way.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 3,
        tags: ['food', 'favorite', 'family'],
      },
      {
        days_ago: 5,
        activity_type: 'activity',
        title: 'Bach piano pieces',
        description: 'Played Glenn Gould\'s recordings of Bach Goldberg Variations. Mr. Chen closed his eyes and swayed gently. Said it reminded him of his honeymoon in Europe.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 3,
        tags: ['music', 'bach', 'piano', 'peaceful', 'memory'],
      },
      {
        days_ago: 4,
        activity_type: 'outing',
        title: 'Visit from his daughter',
        description: 'His daughter visited with her children. Mr. Chen was delighted. He told the grandchildren stories and even sang an old Chinese folk song.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 4,
        tags: ['family', 'social', 'happy', 'grandchildren'],
      },
      {
        days_ago: 3,
        activity_type: 'activity',
        title: 'Simple puzzle together',
        description: 'Worked on a 50-piece jigsaw puzzle with birds. Mr. Chen found it a bit challenging but enjoyed working on it together. Completed it over 45 minutes.',
        mood_rating: 4,
        success_level: 3,
        energy_level: 3,
        tags: ['activity', 'cognitive', 'afternoon'],
      },
      {
        days_ago: 2,
        activity_type: 'relaxation',
        title: 'Gentle hand massage',
        description: 'His hands were a bit stiff. Gave a gentle massage with warming oil. He said it helped and thanked me several times.',
        mood_rating: 4,
        success_level: 4,
        energy_level: 2,
        tags: ['care', 'gentle', 'afternoon'],
      },
      {
        days_ago: 1,
        activity_type: 'activity',
        title: 'Morning Bach session',
        description: 'Started the day with Bach\'s Cello Suites. Mr. Chen was in great spirits, humming along. He even conducted with his hands during his favorite parts.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 4,
        tags: ['music', 'bach', 'morning', 'happy', 'conducting'],
      },
      {
        days_ago: 0,
        activity_type: 'conversation',
        title: 'Sharing about his students',
        description: 'Asked him about memorable students. He became very animated telling stories about a shy girl who blossomed into a confident performer. Eyes sparkled with pride.',
        mood_rating: 5,
        success_level: 5,
        energy_level: 4,
        tags: ['memory', 'teaching', 'morning', 'proud'],
      },
    ];

    // Insert interactions
    for (const interaction of interactions) {
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - interaction.days_ago);
      createdAt.setHours(interaction.tags.includes('morning') ? 9 : interaction.tags.includes('afternoon') ? 14 : 19);

      const { error } = await supabase.from('interactions').insert({
        recipient_id: recipient.id,
        caregiver_id: caregiverId,
        activity_type: interaction.activity_type,
        title: interaction.title,
        description: interaction.description,
        mood_rating: interaction.mood_rating,
        success_level: interaction.success_level,
        energy_level: interaction.energy_level,
        tags: interaction.tags,
        photos: [],
        created_at: createdAt.toISOString(),
      });

      if (error) throw error;
    }
    console.log(`✅ Created ${interactions.length} interactions`);

    // 4. Create learned preferences
    const preferences = [
      {
        category: 'music',
        preference_key: 'Favorite Composer',
        preference_value: 'Bach - especially Brandenburg Concertos and Goldberg Variations',
        confidence_score: 0.95,
        source: 'ai_learned',
      },
      {
        category: 'music',
        preference_key: 'Violin Music',
        preference_value: 'Loves violin sonatas and concertos, gets animated discussing technique',
        confidence_score: 0.9,
        source: 'ai_learned',
      },
      {
        category: 'routine',
        preference_key: 'Best Time of Day',
        preference_value: 'Morning (8-11am) when most alert and energetic',
        confidence_score: 0.92,
        source: 'ai_learned',
      },
      {
        category: 'communication',
        preference_key: 'Communication Style',
        preference_value: 'Responds well to gentle, patient tone and reminiscing',
        confidence_score: 0.88,
        source: 'manual',
      },
      {
        category: 'activity',
        preference_key: 'Favorite Topics',
        preference_value: 'Teaching memories, his students, classical music history',
        confidence_score: 0.93,
        source: 'ai_learned',
      },
      {
        category: 'food',
        preference_key: 'Favorite Foods',
        preference_value: 'Congee with preserved egg, steamed fish with soy sauce',
        confidence_score: 0.87,
        source: 'ai_learned',
      },
      {
        category: 'social',
        preference_key: 'Family Visits',
        preference_value: 'Gets very happy seeing grandchildren, loves telling them stories',
        confidence_score: 0.95,
        source: 'ai_learned',
      },
      {
        category: 'dignity',
        preference_key: 'Respect His Knowledge',
        preference_value: 'Ask about his expertise in music - makes him feel valued and purposeful',
        confidence_score: 0.9,
        source: 'manual',
      },
    ];

    for (const pref of preferences) {
      const { error } = await supabase.from('preferences').insert({
        recipient_id: recipient.id,
        ...pref,
      });
      if (error) throw error;
    }
    console.log(`✅ Created ${preferences.length} preferences`);

    // 5. Create AI suggestions
    const suggestions = [
      {
        suggestion_text: 'Play Bach\'s Violin Concerto in A minor',
        reasoning: 'Mr. Chen has shown consistent joy when listening to Bach, especially pieces featuring violin. Morning is his best time for engagement.',
        context: { time_of_day: 'morning', confidence: 0.92 },
        status: 'pending',
      },
      {
        suggestion_text: 'Ask him to share stories about his most memorable student recital',
        reasoning: 'He becomes animated and happy when reminiscing about his teaching days. Conversations about his students bring pride and purpose.',
        context: { time_of_day: 'morning', confidence: 0.88 },
        status: 'pending',
      },
      {
        suggestion_text: 'Prepare steamed fish for lunch',
        reasoning: 'This is his favorite dish and connects to happy memories of his mother and family.',
        context: { time_of_day: 'afternoon', confidence: 0.85 },
        status: 'pending',
      },
    ];

    for (const suggestion of suggestions) {
      const { error } = await supabase.from('activity_suggestions').insert({
        recipient_id: recipient.id,
        ...suggestion,
      });
      if (error) throw error;
    }
    console.log(`✅ Created ${suggestions.length} AI suggestions`);

    console.log('🎉 Demo data seeded successfully!');
    return { success: true, recipient };
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}
