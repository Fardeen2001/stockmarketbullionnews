import { Metadata } from 'next';

export const metadata = {
  title: 'About Us - StockMarket Bullion',
  description: 'Learn about StockMarket Bullion - Your trusted source for stock market news, gold and silver prices, and Sharia-compliant stock analysis.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About StockMarket Bullion</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            StockMarket Bullion is dedicated to providing comprehensive, real-time financial information 
            and market insights to help investors make informed decisions. We combine cutting-edge AI 
            technology with traditional financial analysis to deliver accurate, timely, and actionable 
            market intelligence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Stock Market Data</h3>
              <p className="text-gray-700">
                Real-time stock prices, market trends, and comprehensive analysis for Indian and global markets. 
                Track your favorite stocks with detailed charts and historical data.
              </p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Precious Metals</h3>
              <p className="text-gray-700">
                Stay updated with current gold, silver, platinum, and palladium prices. Get insights into 
                precious metals markets and investment opportunities.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sharia-Compliant Stocks</h3>
              <p className="text-gray-700">
                Discover stocks that align with Islamic finance principles. Our comprehensive screening 
                helps you identify Sharia-compliant investment opportunities.
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered News</h3>
              <p className="text-gray-700">
                Get the latest market news and analysis powered by artificial intelligence. Our system 
                aggregates information from multiple sources to provide you with comprehensive coverage.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Technology</h2>
          <p className="text-gray-700 mb-4">
            We leverage advanced technologies to deliver the best user experience:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>AI-Powered Content Generation:</strong> Our intelligent systems analyze market data and generate insightful articles</li>
            <li><strong>Real-Time Data:</strong> Live updates from multiple financial data sources</li>
            <li><strong>Vector Search:</strong> Advanced semantic search to find relevant content quickly</li>
            <li><strong>Trend Detection:</strong> AI algorithms identify emerging market trends and opportunities</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
          <p className="text-gray-700 mb-4">
            At StockMarket Bullion, we are committed to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Providing accurate and up-to-date financial information</li>
            <li>Maintaining transparency in our data sources and methodologies</li>
            <li>Protecting user privacy and data security</li>
            <li>Delivering unbiased market analysis and insights</li>
            <li>Continuously improving our platform based on user feedback</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The information provided on StockMarket Bullion is for informational purposes only and does not 
            constitute financial, investment, or trading advice. We do not provide personalized investment 
            recommendations. Always consult with a qualified financial advisor before making investment decisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            We'd love to hear from you! If you have questions, suggestions, or feedback, please visit our 
            <a href="/contact" className="text-blue-600 hover:underline ml-1">contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
