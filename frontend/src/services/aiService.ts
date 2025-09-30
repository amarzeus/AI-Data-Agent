import { apiService } from './apiService'

export interface Intent {
  id: string
  label: string
  confidence: number
  category: 'analysis' | 'summary' | 'visualization' | 'export' | 'filter' | 'compare'
  suggestedQuery: string
  description: string
}

export interface ConversationContext {
  currentTopic: string
  previousQueries: string[]
  dataInsights: string[]
  userPreferences: Record<string, any>
  sessionId: string
}

export interface QueryAnalysis {
  originalQuery: string
  intent: Intent
  entities: string[]
  suggestedQueries: string[]
  requiresClarification: boolean
  confidence: number
}

export interface AIInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'recommendation' | 'summary'
  title: string
  description: string
  confidence: number
  data?: any
  actionable: boolean
}

class AIService {
  private conversationContext: ConversationContext = {
    currentTopic: '',
    previousQueries: [],
    dataInsights: [],
    userPreferences: {},
    sessionId: '1'
  }

  // Advanced intent detection
  async detectIntent(query: string): Promise<Intent[]> {
    try {
      const response = await apiService.aiQuery({
        query: `Analyze this query and detect user intent: "${query}"`,
        file_id: 1,
        context: {
          type: 'intent_detection',
          conversationHistory: this.conversationContext.previousQueries
        }
      })

      // Parse AI response to extract intents
      const intents: Intent[] = this.parseIntentResponse(response.explanation || '')
      return intents
    } catch (error) {
      console.error('Intent detection failed:', error)
      return this.fallbackIntentDetection(query)
    }
  }

  // Parse AI response to extract structured intent data
  private parseIntentResponse(response: string): Intent[] {
    // This would parse the AI's structured response
    // For now, return fallback intents
    return this.fallbackIntentDetection('')
  }

  // Fallback intent detection using keyword matching
  private fallbackIntentDetection(query: string): Intent[] {
    const lowerQuery = query.toLowerCase()
    const intents: Intent[] = []

    // Analysis intents
    if (lowerQuery.includes('top') || lowerQuery.includes('best') || lowerQuery.includes('highest')) {
      intents.push({
        id: 'top_analysis',
        label: 'Top Performers',
        confidence: 0.8,
        category: 'analysis',
        suggestedQuery: 'Show me the top 5 products by revenue',
        description: 'Find top performing items or categories'
      })
    }

    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('growth')) {
      intents.push({
        id: 'trend_analysis',
        label: 'Trend Analysis',
        confidence: 0.9,
        category: 'visualization',
        suggestedQuery: 'Show me sales trends over the last 12 months',
        description: 'Analyze data patterns over time'
      })
    }

    // Summary intents
    if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('total')) {
      intents.push({
        id: 'summary',
        label: 'Data Summary',
        confidence: 0.7,
        category: 'summary',
        suggestedQuery: 'Give me a summary of total revenue by region',
        description: 'Provide overview and key metrics'
      })
    }

    // Comparison intents
    if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
      intents.push({
        id: 'comparison',
        label: 'Compare Data',
        confidence: 0.8,
        category: 'compare',
        suggestedQuery: 'Compare sales between Q1 and Q2',
        description: 'Compare different time periods or categories'
      })
    }

    // Filter intents
    if (lowerQuery.includes('filter') || lowerQuery.includes('where') || lowerQuery.includes('only')) {
      intents.push({
        id: 'filter',
        label: 'Data Filtering',
        confidence: 0.6,
        category: 'filter',
        suggestedQuery: 'Show only products with revenue > $1000',
        description: 'Filter data based on conditions'
      })
    }

    return intents
  }

  // Analyze query and extract entities
  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase()
    const entities: string[] = []
    const suggestedQueries: string[] = []

    // Extract entities (simple keyword extraction)
    const commonEntities = ['revenue', 'sales', 'profit', 'customers', 'products', 'region', 'category', 'date', 'month', 'quarter']
    commonEntities.forEach(entity => {
      if (lowerQuery.includes(entity)) {
        entities.push(entity)
      }
    })

    // Generate suggested queries based on entities
    entities.forEach(entity => {
      switch (entity) {
        case 'revenue':
          suggestedQueries.push('Show total revenue by month')
          suggestedQueries.push('What are the top revenue generating products?')
          break
        case 'sales':
          suggestedQueries.push('Show sales trends over time')
          suggestedQueries.push('Compare sales by region')
          break
        case 'profit':
          suggestedQueries.push('Calculate profit margins')
          suggestedQueries.push('Show most profitable products')
          break
      }
    })

    const intents = this.fallbackIntentDetection(query)
    const primaryIntent = intents.length > 0 ? intents[0] : null

    return {
      originalQuery: query,
      intent: primaryIntent || {
        id: 'unknown',
        label: 'General Query',
        confidence: 0.5,
        category: 'analysis',
        suggestedQuery: query,
        description: 'General data analysis query'
      },
      entities,
      suggestedQueries,
      requiresClarification: entities.length === 0 && !primaryIntent,
      confidence: primaryIntent?.confidence || 0.5
    }
  }

  // Generate contextual suggestions based on conversation history
  generateContextualSuggestions(): string[] {
    const suggestions: string[] = []

    if (this.conversationContext.previousQueries.length > 0) {
      const lastQuery = this.conversationContext.previousQueries[
        this.conversationContext.previousQueries.length - 1
      ].toLowerCase()

      if (lastQuery.includes('revenue')) {
        suggestions.push('Show revenue breakdown by product category')
        suggestions.push('Compare revenue growth quarter over quarter')
      }

      if (lastQuery.includes('sales')) {
        suggestions.push('Analyze sales performance by region')
        suggestions.push('Show sales conversion rates')
      }

      if (lastQuery.includes('trend')) {
        suggestions.push('Forecast next quarter sales')
        suggestions.push('Identify seasonal patterns')
      }
    }

    return suggestions
  }

  // Generate AI insights from data
  async generateInsights(data: any[]): Promise<AIInsight[]> {
    try {
      const response = await apiService.aiQuery({
        query: `Analyze this data and provide key insights: ${JSON.stringify(data.slice(0, 10))}`,
        file_id: 1,
        context: {
          type: 'insight_generation',
          conversationHistory: this.conversationContext.previousQueries
        }
      })

      // Parse AI response to extract insights
      return this.parseInsightResponse(response.explanation || '')
    } catch (error) {
      console.error('Insight generation failed:', error)
      return []
    }
  }

  private parseInsightResponse(response: string): AIInsight[] {
    // This would parse the AI's structured insight response
    // For now, return mock insights
    return [
      {
        type: 'trend',
        title: 'Revenue Growth Trend',
        description: 'Revenue has increased by 15% compared to last quarter',
        confidence: 0.8,
        actionable: true
      },
      {
        type: 'anomaly',
        title: 'Unusual Sales Spike',
        description: 'Product A showed a 300% sales increase in March',
        confidence: 0.9,
        actionable: true
      }
    ]
  }

  // Update conversation context
  updateContext(query: string, response: any) {
    this.conversationContext.previousQueries.push(query)

    // Extract insights from response
    if (response.explanation) {
      this.conversationContext.dataInsights.push(response.explanation)
    }

    // Keep only recent queries (last 10)
    if (this.conversationContext.previousQueries.length > 10) {
      this.conversationContext.previousQueries = this.conversationContext.previousQueries.slice(-10)
    }

    if (this.conversationContext.dataInsights.length > 5) {
      this.conversationContext.dataInsights = this.conversationContext.dataInsights.slice(-5)
    }
  }

  // Get conversation context
  getContext(): ConversationContext {
    return this.conversationContext
  }

  // Reset conversation context
  resetContext() {
    this.conversationContext = {
      currentTopic: '',
      previousQueries: [],
      dataInsights: [],
      userPreferences: {},
      sessionId: this.conversationContext.sessionId
    }
  }

  // Generate follow-up questions
  generateFollowUpQuestions(lastResponse: string): string[] {
    const questions: string[] = []

    if (lastResponse.toLowerCase().includes('revenue')) {
      questions.push('Can you break this down by product category?')
      questions.push('How does this compare to last year?')
    }

    if (lastResponse.toLowerCase().includes('trend')) {
      questions.push('Can you show me the forecast for next quarter?')
      questions.push('What factors might be driving this trend?')
    }

    if (lastResponse.toLowerCase().includes('top')) {
      questions.push('Can you show me the bottom performers too?')
      questions.push('What criteria were used for this ranking?')
    }

    return questions
  }
}

// Export singleton instance
export const aiService = new AIService()

export default aiService
