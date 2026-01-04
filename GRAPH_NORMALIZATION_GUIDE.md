# 📊 Knowledge Graph Normalization Guide

## Overview

The **Graph Normalization** feature (Prompt C) is the final layer of the TeachAI knowledge extraction pipeline. It cleans and consolidates your concept graph by merging duplicates, normalizing names, and removing trivial concepts.

## 4-Layer Pipeline Architecture

```
📄 Document → 🔍 Concept Extraction → 🔗 Relationship Inference → ✨ Graph Normalization
   (Layer 1)      (Prompt A)              (Prompt B)                (Prompt C)
```

### Layer 1: Document Parsing

- Extracts text from PDFs, images, tables
- Chunks content for processing

### Layer 2: Concept Extraction (Prompt A)

- Extracts concepts with rich metadata:
  - name, type, definition
  - examples, dependencies, contrasts
  - evidence, open_questions

### Layer 3: Relationship Inference (Prompt B)

- Builds relationships across chunks
- 8 relationship types: depends_on, related_to, contrasts_with, causes, caused_by, example_of, part_of, parent_child
- Enriches with source metadata (headingPath, pageRange)

### Layer 4: Graph Normalization (Prompt C) ⭐ NEW

- Merges duplicate concepts
- Normalizes concept names to canonical labels
- Removes trivial/redundant concepts
- Updates relationships with normalized names
- Cleans up invalid relationships

---

## How to Use Normalization

### Step 1: Extract Concept Graph

1. Open a document in **Comprehensive Review**
2. Go to **Document Parser** tab
3. Click **"Extract concept graph"**
   - This runs Prompt A and extracts concepts from all chunks
   - You'll see concepts with their metadata (types, definitions, dependencies, etc.)

### Step 2: Generate Mind Map (Optional but Recommended)

1. Click **"Generate mind map (save)"**
   - This runs Prompt A + Prompt B together
   - Extracts concepts AND infers relationships
   - Saves to Firebase for persistence
   - Shows relationship types summary

### Step 3: Normalize the Graph ✨

1. Once you have concepts extracted (from either step 1 or 2), a new button appears:
   - **"✨ Normalize Graph"** (primary blue button)
2. Click it to run normalization
   - Merges duplicate concepts (e.g., "ML" + "Machine Learning" → "Machine Learning")
   - Normalizes names (e.g., "deep neural nets" → "Deep Neural Networks")
   - Removes trivial concepts (e.g., "Introduction", "Summary")
   - Updates all relationships to use normalized names
   - Removes invalid relationships (pointing to deleted concepts)

### Step 4: Review Normalized Results

After normalization completes, you'll see a new **"✨ Normalized Knowledge Graph"** section showing:

#### Statistics Dashboard

- **Original Concepts**: Count before normalization
- **Normalized Concepts**: Count after cleanup
- **Concepts Merged**: How many duplicates were merged (reduction)
- **Original Relationships**: Count before cleanup
- **Normalized Relationships**: Count after validation
- **Relationships Cleaned**: How many invalid relationships removed

#### Normalized Concepts List

- Each concept shows:
  - Name (canonical version)
  - Type (core, supporting, example, etc.)
  - Definition
  - **"Merged from"** badge: Lists original names that were merged into this concept

#### Normalized Relationships List

- Each relationship shows:
  - Source concept → Type → Target concept
  - Color-coded by relationship type
  - Only valid relationships (both endpoints exist in normalized graph)

---

## Example Workflow

### Before Normalization:

```
Concepts:
1. "Machine Learning" (core)
2. "ML" (core)
3. "machine learning" (supporting)
4. "Introduction" (supporting)
5. "Neural Networks" (core)

Relationships:
- Machine Learning → depends_on → Neural Networks
- ML → related_to → Neural Networks
- machine learning → example_of → ML
- Introduction → related_to → Machine Learning  # Invalid (trivial concept)
```

### After Normalization:

```
Concepts:
1. "Machine Learning" (core) [merged from: ML, machine learning]
2. "Neural Networks" (core)

Relationships:
- Machine Learning → depends_on → Neural Networks
- Machine Learning → related_to → Neural Networks

Stats:
- Concepts: 5 → 2 (merged 3)
- Relationships: 4 → 2 (cleaned 2)
```

---

## What Gets Normalized?

### Concept Merging Rules

1. **Case insensitive matching**: "Machine Learning" = "machine learning"
2. **Abbreviation expansion**: "ML" → "Machine Learning"
3. **Synonym detection**: AI identifies similar concepts
4. **Whitespace normalization**: Removes extra spaces

### Concept Removal Rules

Removes concepts that are:

- Generic section markers: "Introduction", "Conclusion", "Summary", "Background"
- Too short: Single-word concepts < 3 characters
- Non-informative: "etc.", "e.g.", "i.e."
- Structural elements: "Figure 1", "Table 2"

### Relationship Cleaning Rules

Removes relationships that:

- Point to deleted concepts
- Are duplicates (same source/target/type)
- Have invalid types
- Point from concept to itself

---

## API Reference

### Endpoint

```
POST /ai/normalize-graph
```

### Request Body

```json
{
  "concepts": [
    {
      "name": "Machine Learning",
      "type": "core",
      "definition": "...",
      "examples": ["..."],
      "depends_on": ["Neural Networks"],
      "evidence": "...",
      "open_questions": "..."
    }
  ],
  "relationships": [
    {
      "source": "Machine Learning",
      "target": "Neural Networks",
      "type": "depends_on",
      "strength": "strong"
    }
  ]
}
```

### Response

```json
{
  "concepts": [...],
  "relationships": [...],
  "stats": {
    "originalConceptCount": 5,
    "normalizedConceptCount": 2,
    "conceptReduction": 3,
    "originalRelationshipCount": 4,
    "normalizedRelationshipCount": 2,
    "relationshipReduction": 2
  }
}
```

---

## Normalization Prompt Details

The AI uses a sophisticated prompt that:

1. **Identifies duplicates** using semantic similarity
2. **Chooses canonical names** (most descriptive version)
3. **Merges metadata** from all variants
4. **Tracks provenance** (mergedFrom field)
5. **Updates relationship endpoints** to use canonical names
6. **Validates relationship integrity**

### Example Normalization Rules in Prompt:

```
- Merge "ML", "Machine Learning", "machine learning" → "Machine Learning"
- Remove "Introduction", "Background", "Summary"
- Remove concepts shorter than 3 characters
- Keep the most descriptive name as canonical
- Update all relationships to use canonical names
- Remove relationships to deleted concepts
```

---

## Tips for Best Results

1. **Extract full mind map first**: Use "Generate mind map (save)" to get both concepts AND relationships before normalizing
2. **Review before normalizing**: Check extracted concepts for quality
3. **Use normalized graph for visualization**: The cleaned graph produces clearer, more actionable diagrams
4. **Iterate if needed**: You can re-extract and re-normalize as your document analysis improves

---

## Troubleshooting

### Button doesn't appear

- Make sure you've extracted concepts first
- Check that `concepts` array has items or `mindMap.concepts` exists

### No reduction after normalization

- Your concepts might already be well-normalized
- Try documents with more variety in naming conventions

### Stats show unexpected results

- Check browser console for any errors
- Verify the backend server is running (port 4000)
- Review the normalization response in Network tab

---

## Future Enhancements

Potential improvements:

- [ ] Manual concept merge UI
- [ ] Custom normalization rules
- [ ] Confidence scores for merges
- [ ] Undo normalization
- [ ] Save normalized graphs to Firebase
- [ ] Compare before/after visualizations side-by-side

---

## Related Files

### Backend

- `backend/services/aiService.js` - `normalizeConceptGraph()` function
- `backend/controllers/aiController.js` - `normalizeGraph()` endpoint
- `backend/routes/ai.js` - `/ai/normalize-graph` route

### Frontend

- `frontend/src/components/ComprehensiveDocumentReview.jsx` - Normalization UI
- `frontend/src/components/ConceptGraphViewer.jsx` - Graph visualization

---

## Summary

The **Graph Normalization** feature completes your knowledge extraction pipeline by:

- ✅ Reducing concept redundancy
- ✅ Creating canonical concept names
- ✅ Cleaning invalid relationships
- ✅ Providing actionable statistics
- ✅ Improving graph visualization quality

**Result**: A cleaner, more actionable knowledge graph ready for visualization and analysis!
