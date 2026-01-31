import { Metadata } from 'next';

export const metadata = {
  title: 'Terms and Conditions - StockMarket Bullion',
  description: 'Terms and Conditions for using StockMarket Bullion website and services.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using stockmarketbullion.com ("the Website"), you accept and agree to be bound 
            by the terms and provision of this agreement. If you do not agree to abide by the above, please 
            do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily download one copy of the materials on StockMarket Bullion's 
            website for personal, non-commercial transitory viewing only. This is the grant of a license, not 
            a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The materials on StockMarket Bullion's website are provided on an 'as is' basis. StockMarket Bullion 
            makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties 
            including, without limitation, implied warranties or conditions of merchantability, fitness for a 
            particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Financial Disclaimer:</strong> The information provided on this website is for informational 
            purposes only and does not constitute financial, investment, or trading advice. StockMarket Bullion 
            does not provide personalized investment recommendations. Always consult with a qualified financial 
            advisor before making investment decisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitations</h2>
          <p className="text-gray-700 mb-4">
            In no event shall StockMarket Bullion or its suppliers be liable for any damages (including, without 
            limitation, damages for loss of data or profit, or due to business interruption) arising out of the 
            use or inability to use the materials on StockMarket Bullion's website, even if StockMarket Bullion 
            or a StockMarket Bullion authorized representative has been notified orally or in writing of the 
            possibility of such damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Accuracy of Materials</h2>
          <p className="text-gray-700 mb-4">
            The materials appearing on StockMarket Bullion's website could include technical, typographical, or 
            photographic errors. StockMarket Bullion does not warrant that any of the materials on its website 
            are accurate, complete, or current. StockMarket Bullion may make changes to the materials contained 
            on its website at any time without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Links</h2>
          <p className="text-gray-700 mb-4">
            StockMarket Bullion has not reviewed all of the sites linked to its website and is not responsible 
            for the contents of any such linked site. The inclusion of any link does not imply endorsement by 
            StockMarket Bullion of the site. Use of any such linked website is at the user's own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modifications</h2>
          <p className="text-gray-700 mb-4">
            StockMarket Bullion may revise these terms of service for its website at any time without notice. 
            By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These terms and conditions are governed by and construed in accordance with the laws of India and you 
            irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> legal@stockmarketbullion.com<br />
            <strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:underline">Contact Page</a>
          </p>
        </section>
      </div>
    </div>
  );
}
