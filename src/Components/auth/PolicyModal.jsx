import React from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const POLICY_CONTENT = {
  terms: {
    title: 'Terms of Service',
    content: `
# Terms of Service

**Last Updated: February 5, 2026**

## 1. Acceptance of Terms
By accessing and using LiaHub, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License
Permission is granted to temporarily access LiaHub for personal, non-commercial use only. This is the grant of a license, not a transfer of title.

## 3. User Accounts
- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the confidentiality of your account credentials
- You must be at least 16 years old to use this service
- You are responsible for all activities that occur under your account

## 4. User Conduct
You agree not to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit harmful or malicious code
- Harass, abuse, or harm other users
- Attempt to gain unauthorized access to our systems

## 5. Content Guidelines
- Users retain ownership of content they post
- By posting content, you grant LiaHub a license to use, modify, and display that content
- We reserve the right to remove content that violates our guidelines

## 6. Limitation of Liability
LiaHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.

## 7. Changes to Terms
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.

## 8. Termination
We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service.

## 9. Contact
For questions about these Terms, please contact us at legal@liahub.com
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
# Privacy Policy

**Last Updated: February 5, 2026**

## 1. Information We Collect
We collect information you provide directly to us, including:
- Name, email address, and username
- Profile information and photos
- Educational and professional information
- Messages and communications
- Usage data and analytics

## 2. How We Use Your Information
We use the information we collect to:
- Provide, maintain, and improve our services
- Send you technical notices and support messages
- Respond to your comments and questions
- Connect you with opportunities and other users
- Analyze usage patterns and trends
- Detect and prevent fraud and abuse

## 3. Information Sharing
We do not sell your personal information. We may share your information:
- With your consent
- With service providers who assist our operations
- To comply with legal obligations
- To protect our rights and prevent fraud
- In connection with a business transfer

## 4. Data Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 5. Your Rights
You have the right to:
- Access your personal information
- Correct inaccurate data
- Request deletion of your data
- Object to processing of your data
- Export your data

## 6. Data Retention
We retain your information for as long as your account is active or as needed to provide you services. You may request deletion at any time.

## 7. International Data Transfers
Your information may be transferred to and processed in countries other than your country of residence.

## 8. Children's Privacy
Our service is not directed to children under 16. We do not knowingly collect information from children under 16.

## 9. Changes to Privacy Policy
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## 10. Contact Us
If you have questions about this Privacy Policy, please contact us at privacy@liahub.com
    `,
  },
  cookies: {
    title: 'Cookie Policy',
    content: `
# Cookie Policy

**Last Updated: February 5, 2026**

## What Are Cookies?
Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience.

## How We Use Cookies

### Essential Cookies
These cookies are necessary for the website to function properly:
- **Authentication cookies**: Keep you logged in
- **Security cookies**: Protect against fraud and abuse
- **Session cookies**: Maintain your session state

### Analytics Cookies
We use analytics cookies to understand how you use our service:
- Page views and navigation patterns
- Feature usage statistics
- Performance monitoring
- Error tracking

### Preference Cookies
These cookies remember your preferences:
- Language preferences
- Display settings
- Theme choices
- Notification preferences

### Marketing Cookies
With your consent, we may use cookies for:
- Personalized content recommendations
- Relevant opportunity suggestions
- Usage analytics for improvement

## Third-Party Cookies
We may use third-party services that set their own cookies:
- Google Analytics (analytics)
- Authentication providers (security)
- CDN providers (performance)

## Managing Cookies
You can control cookies through:
- **Browser settings**: Most browsers allow you to refuse or delete cookies
- **Our settings**: Adjust cookie preferences in your account settings
- **Opt-out tools**: Use third-party opt-out mechanisms

Note: Disabling essential cookies may affect website functionality.

## Cookie Lifespan
- **Session cookies**: Deleted when you close your browser
- **Persistent cookies**: Remain for a set period (up to 2 years)
- **Authentication cookies**: Typically 30 days

## Updates to This Policy
We may update this Cookie Policy to reflect changes in our practices or for legal reasons. Check this page periodically for updates.

## Contact
For questions about our use of cookies, contact us at privacy@liahub.com
    `,
  },
}

export function PolicyModal({ type, isOpen, onClose }) {
  const { isDark } = useTheme()
  if (!isOpen || !type) return null

  const policy = POLICY_CONTENT[type]
  if (!policy) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 transition-colors ${
        isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-black'}`}>{policy.title}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-black'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 transition-colors ${
          isDark
            ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600'
            : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-400'
        }`}>
          <div className="prose prose-invert prose-sm max-w-none">
            {policy.content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={index} className={`text-2xl font-bold mt-6 mb-4 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    {line.replace('# ', '')}
                  </h1>
                )
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className={`text-xl font-semibold mt-5 mb-3 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                    {line.replace('## ', '')}
                  </h2>
                )
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className={`text-lg font-semibold mt-4 mb-2 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {line.replace('### ', '')}
                  </h3>
                )
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className={`font-semibold mt-3 mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                )
              }
              if (line.startsWith('- **')) {
                const match = line.match(/- \*\*(.+?)\*\*:(.+)/)
                if (match) {
                  return (
                    <li key={index} className={`ml-4 mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <strong className={`transition-colors ${isDark ? 'text-white' : 'text-black'}`}>{match[1]}:</strong>
                      {match[2]}
                    </li>
                  )
                }
              }
              if (line.startsWith('- ')) {
                return (
                  <li key={index} className={`ml-4 mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {line.replace('- ', '')}
                  </li>
                )
              }
              if (line.trim() === '') {
                return <div key={index} className="h-2" />
              }
              return (
                <p key={index} className={`mb-3 leading-relaxed transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {line}
                </p>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t transition-colors ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full h-12 font-semibold rounded-full transition-all duration-300 ${
              isDark ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
