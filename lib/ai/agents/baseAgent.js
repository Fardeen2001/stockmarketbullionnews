// Base Agent class for AI agents
export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.tools = [];
    this.memory = [];
  }

  // Agent execution method (to be overridden)
  async execute(task, context = {}) {
    throw new Error('execute method must be implemented by subclass');
  }

  // Add tool to agent
  addTool(tool) {
    this.tools.push(tool);
  }

  // Store in agent memory
  remember(key, value) {
    this.memory.push({ key, value, timestamp: new Date() });
  }

  // Retrieve from memory
  recall(key) {
    const memories = this.memory.filter(m => m.key === key);
    return memories.length > 0 ? memories[memories.length - 1].value : null;
  }

  // Clear memory
  clearMemory() {
    this.memory = [];
  }

  // Log agent activity
  log(message, data = {}) {
    console.log(`[${this.name}] ${message}`, data);
  }
}
