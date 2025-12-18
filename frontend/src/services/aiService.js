import api from '../api/api.js';

export const aiService = {
  /**
   * Ask AI a question about a specific document
   * @param {Object} document - The document object
   * @param {string} question - The user's question
   * @returns {Promise<string>} - AI response
   */
  async askQuestion(document, question) {
    try {
      const response = await api.post('/ai/ask', {
        documentId: document.id,
        question: question,
        context: {
          filename: document.filename,
          summary: document.analysis?.summary?.text,
          topics: document.analysis?.topics?.items,
          entities: document.analysis?.entities?.items,
          sentiment: document.analysis?.sentiment,
          content: document.content // If available
        }
      });

      return response.data.answer;
    } catch (error) {
      console.error('Error asking AI:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  },

  /**
   * Get document insights and suggestions
   * @param {Object} document - The document object
   * @returns {Promise<Object>} - AI insights
   */
  async getInsights(document) {
    try {
      const response = await api.post('/ai/insights', {
        documentId: document.id,
        analysis: document.analysis
      });

      return response.data.insights;
    } catch (error) {
      console.error('Error getting insights:', error);
      throw new Error('Failed to get AI insights. Please try again.');
    }
  }
};
