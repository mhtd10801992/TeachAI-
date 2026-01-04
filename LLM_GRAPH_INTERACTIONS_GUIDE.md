# 🤖 LLM-Powered Graph Interactions Guide

## Overview

Your knowledge graph now has **intelligent AI tutoring** built directly into the visualization. Click, compare, and learn from your concepts with real-time LLM-powered explanations.

---

## 🎯 Interactive Features

### 1. 💡 Explain Concept Mode

**How to use:**

1. Click the **"💡 Explain"** button in the mode selector
2. Click any node in the graph
3. Get instant AI explanation with:
   - Simple explanation (for beginners)
   - Technical explanation (for experts)
   - Concrete examples
   - Key relationships to connected concepts

**What you get:**

```
💡 Explain: Machine Learning

Simple Explanation:
Machine Learning is a way for computers to learn patterns from data...

Technical Explanation:
Machine Learning employs statistical algorithms to build models...

Concrete Examples:
1. Email spam filters that learn from labeled examples...
2. Recommendation systems that predict user preferences...

Key Relationships:
- Depends on: Statistics, Linear Algebra
- Related to: Neural Networks, Deep Learning
```

**Use cases:**

- Quick concept refresh
- Understanding unfamiliar terms
- Getting real-world context
- Learning prerequisites

---

### 2. 🔄 Compare Concepts Mode

**How to use:**

1. Click the **"🔄 Compare"** button
2. Click first concept → becomes **selected** (highlighted)
3. Click second concept → **comparison triggers automatically**
4. View detailed side-by-side analysis

**What you get:**

```
🔄 Compare: Supervised Learning vs Unsupervised Learning

Similarities:
- Both are machine learning paradigms
- Both learn patterns from data
- Both use statistical algorithms

Differences:
- Supervised uses labeled data; Unsupervised doesn't
- Supervised predicts outcomes; Unsupervised discovers structure
- Supervised requires training labels; Unsupervised is exploratory

Relationship:
These are complementary approaches often used together...

Usage Context:
Use Supervised when you have labeled examples and a clear prediction goal.
Use Unsupervised for exploratory data analysis and pattern discovery.
```

**Use cases:**

- Understanding distinctions between similar concepts
- Deciding which approach to use
- Finding relationships between ideas
- Study comparison for exams

---

### 3. 🔗 Reasoning Chain Explanation

**How to use:**

1. Click **"🔄 Compare"** mode
2. Select **2 concepts** (they become highlighted)
3. Click **"🔗 Reasoning Chain"** button
4. AI finds the path between concepts and explains the logical flow

**What you get:**

```
🔗 Reasoning Chain: Statistics → Machine Learning → Neural Networks

Overview:
This chain represents the foundational progression from classical statistics
through modern machine learning to advanced neural network architectures.

Step-by-Step Flow:
1. Statistics provides the mathematical foundation...
2. Machine Learning builds on statistical principles...
3. Neural Networks are a specific ML implementation...

Logical Dependencies:
- Statistics must be understood first (probability, distributions)
- ML generalizes statistical concepts (supervised/unsupervised)
- Neural Networks apply ML to complex hierarchical patterns

Key Insights:
Understanding this progression is essential because each concept
builds on the previous one, creating a learning path.
```

**Use cases:**

- Understanding concept dependencies
- Finding learning paths
- Discovering prerequisite knowledge
- Explaining why concepts are connected

**Technical details:**

- Uses BFS (Breadth-First Search) to find shortest path
- Works across any distance in the graph
- Shows intermediate concepts in the path
- Explains each step's logical connection

---

### 4. 📝 Generate Quiz (Right-Click)

**How to use:**

1. **Right-click** any node in the graph
2. Wait for AI to generate personalized quiz
3. Get 5 questions covering different aspects

**What you get:**

```
📝 Quiz: Neural Networks

Question 1 (Multiple Choice):
Which activation function is commonly used in modern neural networks?
A) Linear
B) Step function
C) ReLU ✓
D) Constant

Question 2 (Multiple Choice):
What problem does backpropagation solve?
A) Data preprocessing
B) Weight optimization ✓
C) Input validation
D) Output formatting

Question 3 (Short Answer):
Explain the role of hidden layers in a neural network.
Model Answer: Hidden layers extract hierarchical features...

Question 4 (Short Answer):
Why is gradient descent important in neural network training?
Model Answer: Gradient descent minimizes the loss function...

Question 5 (Application/Scenario):
You're building a neural network for image classification but it's
overfitting on training data. What techniques would you apply and why?
Model Answer: Apply dropout, L2 regularization, data augmentation...
```

**Question types:**

- **Multiple choice** (2 questions) - Quick knowledge checks
- **Short answer** (2 questions) - Deeper understanding
- **Application** (1 question) - Real-world problem solving

**Use cases:**

- Self-assessment
- Exam preparation
- Testing understanding
- Active learning
- Teaching others

---

## 🎨 User Interface

### Mode Selector Bar

```
🤖 AI Mode:  [💡 Explain]  [🔄 Compare (1/2)]  [🔗 Reasoning Chain]  💡 Right-click node for quiz
```

**Status indicators:**

- **Blue button** = Active mode
- **Gray button** = Inactive mode
- **Compare counter** = Shows selection progress (0/2, 1/2)
- **Green chain button** = Enabled when 2 nodes selected
- **Gray chain button** = Disabled (need 2 nodes)

### Response Panel

Shows AI explanations below the graph with:

- **Title bar** with concept name(s)
- **Close button** (✕) in top-right
- **Scrollable content** for long explanations
- **Formatted text** with clear sections

### Loading Indicator

```
🤖 AI is thinking...
```

Animated spinner shows when LLM is processing

---

## 🔧 Technical Implementation

### Backend API Endpoints

```javascript
POST / ai / graph / explain - concept;
Body: {
  concept, neighbors;
}
Response: {
  success, explanation, concept;
}

POST / ai / graph / compare - concepts;
Body: {
  conceptA, conceptB;
}
Response: {
  success, comparison, concepts;
}

POST / ai / graph / reasoning - chain;
Body: {
  concepts;
}
Response: {
  success, explanation, conceptChain;
}

POST / ai / graph / generate - quiz;
Body: {
  concept;
}
Response: {
  success, quiz, concept;
}
```

### Frontend Components

**ConceptGraphViewer.jsx** enhancements:

- Mode state management
- Node selection tracking
- LLM API calls with error handling
- Response display panel
- Loading states
- Graph interaction handlers

### LLM Integration

**Provider:** OpenAI (GPT-3.5-turbo) or Anthropic (Claude-3-opus)

- Configured via `AI_PROVIDER` environment variable
- Uses existing `runChat()` abstraction
- Token limits: 600-800 tokens per response
- Structured prompts with clear requirements

---

## 💡 Usage Tips

### Getting the Best Explanations

1. **Build complete graphs first**: More context = better explanations
2. **Use normalization**: Cleaner graphs produce clearer explanations
3. **Hover before clicking**: See connections to understand context
4. **Try different modes**: Each mode reveals different insights

### Efficient Workflow

**For Learning:**

```
1. Extract concepts → 2. Normalize graph → 3. Explain unfamiliar concepts →
4. Compare similar concepts → 5. Find reasoning chains → 6. Generate quizzes
```

**For Teaching:**

```
1. Build mind map → 2. Generate quizzes for students →
3. Use comparisons to clarify distinctions → 4. Show reasoning chains for dependencies
```

**For Research:**

```
1. Extract from papers → 2. Find concept relationships →
3. Explain technical terms → 4. Discover learning paths
```

### Keyboard Shortcuts

| Action                 | Shortcut                        |
| ---------------------- | ------------------------------- |
| Switch to Explain mode | Click "💡 Explain" button       |
| Switch to Compare mode | Click "🔄 Compare" button       |
| Generate quiz          | Right-click node                |
| Zoom to node           | Double-click node               |
| Close response panel   | Click "✕" or click another node |
| Reset selection        | Click "Compare" button again    |

---

## 🎯 Examples

### Example 1: Learning Path Discovery

**Scenario:** You want to learn Deep Learning but don't know where to start.

**Steps:**

1. Load your ML research paper
2. Find "Deep Learning" node
3. Right-click → look at dependencies in quiz
4. Switch to Compare mode
5. Select "Deep Learning" and "Machine Learning"
6. Read comparison to understand relationship
7. Select "Machine Learning" and "Statistics"
8. Click "Reasoning Chain" to see learning path

**Result:** Clear progression: Statistics → ML → Deep Learning

---

### Example 2: Exam Preparation

**Scenario:** Preparing for a machine learning exam.

**Steps:**

1. Generate mind map from textbook chapters
2. Explain each core concept (click nodes)
3. Compare confusing pairs (e.g., precision vs recall)
4. Generate quiz for each topic (right-click)
5. Test yourself with AI-generated questions

**Result:** Comprehensive study materials with explanations and practice questions

---

### Example 3: Research Paper Analysis

**Scenario:** Understanding a complex research paper.

**Steps:**

1. Extract concepts from paper
2. Normalize to clean up duplicates
3. Explain technical terms you don't understand
4. Find reasoning chains between key contributions
5. Compare novel concepts with existing methods

**Result:** Deep understanding of paper's contributions and context

---

## 🚀 Advanced Features

### Custom Prompts

The LLM prompts are structured to:

- Start with simple explanations
- Progress to technical details
- Provide concrete examples
- Connect to related concepts
- Format with clear headings

### Context Awareness

Each LLM call includes:

- **Concept metadata**: definition, type, examples
- **Relationship data**: dependencies, related concepts
- **Graph structure**: neighbors, paths
- **Document context**: page ranges, headings

### Error Handling

Graceful failures:

- Network errors → Retry or show error message
- Invalid paths → "No path found" message
- Empty responses → Fallback to basic display
- Timeout → Loading indicator with timeout message

---

## 📊 Performance

### Response Times

| Feature          | Typical Time | Max Tokens |
| ---------------- | ------------ | ---------- |
| Explain Concept  | 2-5 seconds  | 600        |
| Compare Concepts | 3-6 seconds  | 700        |
| Reasoning Chain  | 4-8 seconds  | 800        |
| Generate Quiz    | 4-8 seconds  | 800        |

### Token Usage

Approximate tokens per request:

- **Input**: 100-300 tokens (concept data + prompt)
- **Output**: 400-800 tokens (AI response)
- **Total per interaction**: ~500-1100 tokens

**Cost estimate** (GPT-3.5-turbo):

- ~$0.001 - $0.002 per interaction
- ~$1 for 500-1000 interactions

---

## 🐛 Troubleshooting

### "Failed to explain concept"

- **Check:** Backend server running (port 4000)
- **Check:** OPENAI_API_KEY or ANTHROPIC_API_KEY set
- **Check:** Network connectivity
- **Solution:** Restart backend, verify API keys

### Response panel doesn't appear

- **Check:** Click node after selecting mode
- **Check:** Browser console for errors
- **Solution:** Refresh page, check mode selection

### Compare mode stuck at 1/2

- **Issue:** Second node not selecting
- **Solution:** Click "Compare" button to reset, try again

### Reasoning chain says "No path found"

- **Issue:** Concepts not connected in graph
- **Reason:** Missing relationships or separate subgraphs
- **Solution:** Use relationship inference to connect more concepts

### Quiz generation slow

- **Normal:** Generating 5 questions takes time
- **Typical:** 5-10 seconds
- **Solution:** Wait for loading indicator to finish

---

## 🔮 Future Enhancements

Potential additions:

### Phase 1: Enhanced Interactions

- [ ] Multi-concept comparison (3+ concepts)
- [ ] Concept similarity search
- [ ] Automatic learning path generation
- [ ] Spaced repetition quiz scheduler

### Phase 2: Personalization

- [ ] Save explanation preferences
- [ ] Track quiz performance
- [ ] Adaptive difficulty levels
- [ ] Personal learning history

### Phase 3: Collaboration

- [ ] Share explanations with team
- [ ] Collaborative quizzes
- [ ] Annotation and notes
- [ ] Discussion threads on concepts

### Phase 4: Advanced AI

- [ ] Voice explanations (TTS)
- [ ] Visual diagrams generation
- [ ] Code examples for methods
- [ ] Real-time follow-up questions

---

## 📚 Related Documentation

- [Cytoscape Graph Guide](./CYTOSCAPE_GRAPH_GUIDE.md) - Graph visualization details
- [Graph Normalization Guide](./GRAPH_NORMALIZATION_GUIDE.md) - Cleaning concepts
- [AI Chat Workflow Guide](./AI_CHAT_WORKFLOW_GUIDE.md) - Concept extraction

---

## 🎉 Summary

Your knowledge graph is now an **intelligent learning companion**:

✅ **Explain concepts** with simple + technical explanations  
✅ **Compare concepts** to understand distinctions  
✅ **Find reasoning chains** between any two concepts  
✅ **Generate quizzes** for active learning  
✅ **Real-time AI** powered by GPT/Claude  
✅ **Beautiful UI** with mode selection  
✅ **Smart context** from graph structure  
✅ **Error handling** with graceful failures

**Transform static concepts into interactive learning experiences! 🚀**
