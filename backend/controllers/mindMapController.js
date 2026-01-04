// Mind Map Controller - Handles multi-document categorization and mind map generation
import OpenAI from 'openai';
import { loadDocumentsFromFirebase, saveMindMapToFirebase, getMindMapFromFirebase, listMindMapsFromFirebase } from '../services/firebaseStorageService.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Categories for document classification
const CATEGORIES = [
  'Cost Saving',
  'Efficiency Improvement',
  'Technology Advancement',
  'Employee Training',
  'Process Optimization',
  'Risk Management',
  'Customer Experience',
  'Innovation',
  'Sustainability',
  'Quality Improvement'
];

/**
 * Categorize multiple documents and generate mind maps for each category
 */
export const categorizeAndGenerateMindMaps = async (req, res) => {
  try {
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of document IDs' });
    }

    console.log(`📚 Processing ${documentIds.length} documents for categorization...`);

    // Load all documents from Firebase
    const allDocuments = await loadDocumentsFromFirebase();
    console.log(`✅ Loaded ${allDocuments.length} documents from Firebase`);

    // Filter requested documents - handle both direct and nested ID structures
    const selectedDocs = allDocuments.filter(doc => {
      const docId = doc.id || doc.document?.id;
      return documentIds.includes(docId);
    });

    if (selectedDocs.length === 0) {
      return res.status(404).json({ error: 'No documents found with provided IDs' });
    }

    console.log(`✅ Found ${selectedDocs.length} documents`);

    // Categorize each document using AI with existing extracted data
    // Use OpenAI to categorize documents based on EXISTING data (no re-analysis)
    
    const categorizedDocs = [];
    for (const doc of selectedDocs) {
      // Use existing concepts and relationships if available - handle nested structure
      const docId = doc.id || doc.document?.id;
      const docTitle = doc.title || doc.document?.filename || doc.document?.title || 'Untitled';
      const docSummary = doc.summary || doc.document?.analysis?.summary?.text || doc.analysis?.summary?.text || 'No summary';
      
      // Extract existing data from various sources
      const existingConcepts = doc.concepts || doc.analysis?.concepts?.items || [];
      const existingEntities = doc.entities || doc.analysis?.entities?.items || doc.document?.analysis?.entities?.items || [];
      const existingRelationships = doc.relationships || doc.analysis?.relationships?.items || [];
      const existingTopics = doc.topics || doc.analysis?.topics?.items || doc.document?.analysis?.topics?.items || [];
      const existingInsights = doc.insights || doc.analysis?.insights || doc.document?.analysis?.insights || [];
      
      // Combine concepts and entities as concepts for mind mapping
      const allConcepts = [
        ...existingConcepts.map(c => ({ name: c.name || c.text, type: c.type || 'concept', description: c.description || c.context })),
        ...existingEntities.map(e => ({ name: e.name || e.text, type: e.type || 'entity', description: '' }))
      ];
      
      const prompt = `Analyze this document and categorize it into one or more of these categories:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Document Title: ${docTitle}
Document Summary: ${docSummary.substring(0, 200)}

ALREADY EXTRACTED DATA (use this):
Entities & Concepts: ${allConcepts.slice(0, 20).map(c => `${c.name} (${c.type})`).join(' | ') || 'None extracted'}

Topics: ${existingTopics.map(t => t.name || t.text || t).slice(0, 8).join(', ') || 'None extracted'}

Key Insights: ${existingInsights.slice(0, 3).map(i => i.insight || i.text || i).join(' | ') || 'None extracted'}

Document Type: ${doc.fileType || doc.document?.filename?.split('.').pop() || 'Unknown'}
Has Analysis: ${(allConcepts.length > 0 || existingTopics.length > 0) ? 'Yes' : 'No'}

Instructions:
1. Use the EXTRACTED ENTITIES, TOPICS, and INSIGHTS above to determine categories
2. Identify PRIMARY category (only one) based on the concepts and relationships
3. Identify SECONDARY categories (0-3)
4. Map existing concepts to each category
5. Rate relevance (0-100)

Respond in JSON format:
{
  "primaryCategory": "Category Name",
  "secondaryCategories": ["Category1", "Category2"],
  "categoriesWithConcepts": {
    "Category Name": {
      "relevance": 85,
      "concepts": ["concept1", "concept2", "concept3"],
      "reasoning": "Brief explanation"
    }
  }
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });
      const text = response.choices[0].message.content.trim();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const categorization = JSON.parse(jsonMatch[0]);
        categorizedDocs.push({
          id: docId,
          title: docTitle,
          summary: docSummary,
          originalDoc: doc,
          categorization,
          // Preserve existing extracted data (concepts include entities)
          existingConcepts: allConcepts,
          existingEntities,
          existingRelationships,
          existingTopics,
          existingInsights
        });
        console.log(`✅ Categorized "${docTitle}": ${categorization.primaryCategory}`);
      } else {
        console.warn(`⚠️ Could not categorize "${docTitle}"`);
        categorizedDocs.push({
          id: docId,
          title: docTitle,
          summary: docSummary,
          originalDoc: doc,
          categorization: { primaryCategory: 'Uncategorized', secondaryCategories: [], categoriesWithConcepts: {} },
          existingConcepts: allConcepts,
          existingEntities,
          existingRelationships,
          existingTopics,
          existingInsights
        });
      }
    }

    // Group documents by category
    const categoryGroups = {};
    for (const doc of categorizedDocs) {
      const primary = doc.categorization.primaryCategory;
      if (!categoryGroups[primary]) {
        categoryGroups[primary] = [];
      }
      categoryGroups[primary].push(doc);

      // Also add to secondary categories
      for (const secondary of (doc.categorization.secondaryCategories || [])) {
        if (!categoryGroups[secondary]) {
          categoryGroups[secondary] = [];
        }
        categoryGroups[secondary].push(doc);
      }
    }

    console.log(`📊 Found ${Object.keys(categoryGroups).length} categories`);

    // Generate mind map for each category using existing extracted data
    const categoryMindMaps = {};
    for (const [category, docs] of Object.entries(categoryGroups)) {
      console.log(`🧠 Generating mind map for "${category}" with ${docs.length} document(s)...`);
      
      // Collect all existing concepts from documents in this category
      const allExistingConcepts = [];
      const allExistingRelationships = [];
      
      docs.forEach(doc => {
        if (doc.existingConcepts && Array.isArray(doc.existingConcepts)) {
          allExistingConcepts.push(...doc.existingConcepts.map(c => ({
            ...c,
            sourceDoc: doc.id,
            sourceTitle: doc.title
          })));
        }
        if (doc.existingRelationships && Array.isArray(doc.existingRelationships)) {
          allExistingRelationships.push(...doc.existingRelationships.map(r => ({
            ...r,
            sourceDoc: doc.id
          })));
        }
      });

      console.log(`  📝 Using ${allExistingConcepts.length} existing concepts and ${allExistingRelationships.length} existing relationships`);
      
      const conceptsPrompt = `Create a unified mind map for the "${category}" category using EXISTING EXTRACTED DATA from these documents:

${docs.map((d, i) => `
Document ${i + 1}: ${d.title || 'Untitled'}
Categorization: ${d.categorization.categoriesWithConcepts[category]?.reasoning || 'N/A'}
Extracted Concepts: ${d.existingConcepts?.slice(0, 10).map(c => c.name).join(', ') || 'None'}
`).join('\n')}

ALL EXTRACTED CONCEPTS AVAILABLE:
${allExistingConcepts.slice(0, 50).map(c => `- ${c.name} (${c.type || 'concept'}): ${c.description?.substring(0, 100) || ''} [from ${c.sourceTitle}]`).join('\n')}

EXISTING RELATIONSHIPS:
${allExistingRelationships.slice(0, 30).map(r => `- ${r.source} --[${r.type || 'relates-to'}]--> ${r.target}`).join('\n')}

Instructions:
1. Use the EXISTING CONCEPTS above (don't create new ones)
2. Select 8-15 most relevant concepts for "${category}"
3. Use EXISTING RELATIONSHIPS where available
4. Add new relationships only if needed to connect concepts
5. Group related concepts together
6. Assign importance based on relevance to ${category}

Respond in JSON format:
{
  "category": "${category}",
  "centralConcept": {
    "name": "Central Concept for ${category}",
    "description": "Brief description"
  },
  "concepts": [
    {
      "id": "concept-1",
      "name": "Exact name from extracted concepts",
      "description": "From extracted data",
      "type": "concept|process|entity|etc",
      "relatedDocuments": ["doc-id-1"],
      "importance": 9,
      "sourceDoc": "doc-id"
    }
  ],
  "relationships": [
    {
      "from": "concept-1",
      "to": "concept-2",
      "type": "parent-child|related-to|leads-to|depends-on",
      "description": "How they relate",
      "isExisting": true
    }
  ]
}`;

      const mindMapResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: conceptsPrompt }],
        max_tokens: 1500,
        temperature: 0.3
      });
      const mindMapText = mindMapResponse.choices[0].message.content.trim();
      
      const mindMapJsonMatch = mindMapText.match(/\{[\s\S]*\}/);
      if (mindMapJsonMatch) {
        const mindMap = JSON.parse(mindMapJsonMatch[0]);
        categoryMindMaps[category] = {
          ...mindMap,
          documentCount: docs.length,
          documents: docs.map(d => ({ id: d.id, title: d.title })),
          totalExtractedConcepts: allExistingConcepts.length,
          totalExtractedRelationships: allExistingRelationships.length,
          usesExtractedData: true
        };
        console.log(`✅ Generated mind map for "${category}" with ${mindMap.concepts?.length || 0} concepts (from ${allExistingConcepts.length} extracted)`);
      }
    }

    // Generate inter-category relationships
    console.log('🔗 Analyzing relationships between categories...');
    const categoryRelationshipsPrompt = `Analyze the relationships between these categories and their content:

${Object.entries(categoryMindMaps).map(([cat, data]) => `
Category: ${cat}
Key Concepts: ${data.concepts?.map(c => c.name).join(', ') || 'None'}
Documents: ${data.documents?.map(d => d.title).join(', ')}
`).join('\n')}

Identify meaningful relationships between these categories. For example:
- "Cost Saving" might enable "Technology Advancement"
- "Employee Training" supports "Efficiency Improvement"
- "Innovation" leads to "Customer Experience"

Respond with JSON:
{
  "relationships": [
    {
      "fromCategory": "Category A",
      "toCategory": "Category B",
      "relationshipType": "enables|supports|leads-to|depends-on|complements",
      "strength": 8,
      "description": "How they relate"
    }
  ]
}`;

    const relResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: categoryRelationshipsPrompt }],
      max_tokens: 800,
      temperature: 0.3
    });
    const relText = relResponse.choices[0].message.content.trim();
    
    const relJsonMatch = relText.match(/\{[\s\S]*\}/);
    let categoryRelationships = [];
    if (relJsonMatch) {
      const relData = JSON.parse(relJsonMatch[0]);
      categoryRelationships = relData.relationships || [];
      console.log(`✅ Found ${categoryRelationships.length} inter-category relationships`);
    }

    // Create mind map data structure to save
    const mindMapData = {
      id: `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'multi-document-categorization',
      createdAt: new Date().toISOString(),
      totalDocuments: selectedDocs.length,
      documentIds: selectedDocs.map(d => d.id),
      documentTitles: selectedDocs.map(d => d.title),
      categorizedDocuments: categorizedDocs,
      categories: Object.keys(categoryGroups),
      categoryGroups,
      categoryMindMaps,
      categoryRelationships,
      metadata: {
        usesExtractedData: true,
        totalConcepts: Object.values(categoryMindMaps).reduce((sum, m) => sum + (m.concepts?.length || 0), 0),
        totalRelationships: Object.values(categoryMindMaps).reduce((sum, m) => sum + (m.relationships?.length || 0), 0) + categoryRelationships.length,
        categoriesCount: Object.keys(categoryGroups).length
      }
    };

    // Save mind map to Firebase Storage in dedicated mindmap folder
    console.log(`💾 Attempting to save mind map: ${mindMapData.id}`);
    try {
      const saveResult = await saveMindMapToFirebase(mindMapData.id, mindMapData);
      console.log(`✅ Mind map saved successfully:`, saveResult);
      console.log(`   - ID: ${mindMapData.id}`);
      console.log(`   - Storage: ${saveResult.storage || 'unknown'}`);
      console.log(`   - Path: ${saveResult.firebasePath || saveResult.localPath || 'unknown'}`);
    } catch (saveError) {
      console.error('❌ Failed to save mind map:', saveError);
      console.error('   - Error message:', saveError.message);
      console.error('   - Error stack:', saveError.stack);
      // Don't fail the request if save fails
    }

    // Return comprehensive result
    res.json({
      success: true,
      mindMapId: mindMapData.id,
      totalDocuments: selectedDocs.length,
      categorizedDocuments: categorizedDocs,
      categories: Object.keys(categoryGroups),
      categoryGroups,
      categoryMindMaps,
      categoryRelationships,
      timestamp: new Date().toISOString(),
      saved: true
    });

  } catch (error) {
    console.error('❌ Error in categorizeAndGenerateMindMaps:', error);
    res.status(500).json({ 
      error: 'Failed to categorize documents and generate mind maps',
      details: error.message 
    });
  }
};

/**
 * Get all available documents for selection
 */
export const getAvailableDocuments = async (req, res) => {
  try {
    console.log('📚 Loading documents from Firebase for Mind Map selection...');
    
    // Load all documents from Firebase (using cache)
    const allDocuments = await loadDocumentsFromFirebase(true);
    
    console.log(`✅ Loaded ${allDocuments.length} documents from Firebase`);

    const documentList = allDocuments.map(doc => {
      // Handle different document structures
      const docId = doc.id || doc.document?.id;
      const docTitle = doc.title || doc.document?.filename || doc.document?.title || 'Untitled';
      const docSummary = doc.summary || doc.document?.analysis?.summary?.text || doc.analysis?.summary?.text || 'No summary available';
      const docCreatedAt = doc.createdAt || doc.document?.uploadDate;
      const docConcepts = doc.concepts || doc.analysis?.concepts?.items || [];
      
      return {
        id: docId,
        title: docTitle,
        createdAt: docCreatedAt,
        summary: typeof docSummary === 'string' ? docSummary.substring(0, 150) + (docSummary.length > 150 ? '...' : '') : 'No summary',
        hasAnalysis: !!(docConcepts && docConcepts.length > 0),
        category: doc.category || 'General',
        tags: doc.tags || []
      };
    });

    console.log(`📤 Sending ${documentList.length} documents to frontend`);

    res.json({
      success: true,
      documents: documentList,
      total: documentList.length
    });
  } catch (error) {
    console.error('❌ Error getting documents:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      details: error.message 
    });
  }
};

/**
 * Get all saved mind maps
 */
export const getSavedMindMaps = async (req, res) => {
  try {
    console.log('🗂️ Loading saved mind maps...');
    
    const mindMaps = await listMindMapsFromFirebase();
    
    console.log(`✅ Found ${mindMaps.length} saved mind maps`);
    if (mindMaps.length > 0) {
      console.log('   Mind maps:', mindMaps.map(m => `${m.id} (${m.createdAt})`).join(', '));
    }

    res.json({
      success: true,
      mindMaps,
      total: mindMaps.length
    });
  } catch (error) {
    console.error('❌ Error getting saved mind maps:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve saved mind maps',
      details: error.message 
    });
  }
};

/**
 * Load a specific saved mind map by ID
 */
export const loadMindMap = async (req, res) => {
  try {
    const { mindMapId } = req.params;
    
    console.log(`📂 Loading mind map: ${mindMapId}`);
    
    const mindMapData = await getMindMapFromFirebase(mindMapId);
    
    if (!mindMapData) {
      return res.status(404).json({ 
        error: 'Mind map not found',
        mindMapId 
      });
    }

    console.log(`✅ Loaded mind map: ${mindMapId}`);

    res.json({
      success: true,
      ...mindMapData
    });
  } catch (error) {
    console.error('❌ Error loading mind map:', error);
    res.status(500).json({ 
      error: 'Failed to load mind map',
      details: error.message 
    });
  }
};

/**
 * Analyze a specific factor using AI
 */
export const analyzeFactor = async (req, res) => {
  try {
    const { concept, factorKey, factorValue, category, relationships, allConcepts } = req.body;

    console.log(`🔍 Analyzing factor "${factorKey}" for concept "${concept.name}" in category "${category}"`);

    // Build context for AI
    const relatedRelationships = relationships.filter(
      rel => rel.from === concept.name || rel.to === concept.name
    );

    const prompt = `Analyze this factor from a mind map concept:

Concept: ${concept.name}
Category: ${category}
Factor: ${factorKey}
Value: ${typeof factorValue === 'object' ? JSON.stringify(factorValue) : factorValue}

Context:
- Description: ${concept.description || 'N/A'}
- Type: ${concept.type || 'N/A'}
- Importance: ${concept.importance || 'N/A'}/10

Relationships to other concepts:
${relatedRelationships.map(rel => 
  `- ${rel.from === concept.name ? 'To' : 'From'} "${rel.from === concept.name ? rel.to : rel.from}": ${rel.type} ${rel.description ? '(' + rel.description + ')' : ''}`
).join('\n') || 'None'}

Related concepts in this category:
${allConcepts.slice(0, 5).map(c => `- ${c.name}${c.description ? ': ' + c.description : ''}`).join('\n')}

Please provide:
1. What this factor means in the context of this concept
2. How it relates to the concept's purpose and the overall category
3. Its significance and implications
4. How it connects with related concepts mentioned above

Keep the response clear, concise (3-5 sentences), and focused on actionable insights.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const analysis = response.choices[0].message.content.trim();

    console.log(`✅ Factor analysis complete`);

    res.json({
      success: true,
      analysis,
      factorKey,
      conceptName: concept.name
    });

  } catch (error) {
    console.error('❌ Error analyzing factor:', error);
    res.status(500).json({ 
      error: 'Failed to analyze factor',
      details: error.message 
    });
  }
};

