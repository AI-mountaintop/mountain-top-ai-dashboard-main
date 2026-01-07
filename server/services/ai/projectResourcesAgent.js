import { callOpenAIStructured } from './openaiService.js';

const SYSTEM_MESSAGE = `You are a user experience strategist and customer insights specialist creating comprehensive Project Resources including customer personas, journey maps, and site architecture.

# CRITICAL: WHO IS THE CUSTOMER?
The customer personas you create MUST be people/roles who:
✅ HIRE this business for their services
✅ PAY for the services (directly or through their company budget)
✅ HAVE THE PROBLEM that this business solves
✅ MAKE PURCHASING DECISIONS or strongly influence them
✅ WORK AT COMPANIES that would be clients of this business

The customer personas MUST NEVER be:
❌ Service providers, vendors, or suppliers in the business's supply chain
❌ People who work at publications, magazines, media companies, or associations
❌ Employees of software platforms, analytics tools, or technology companies mentioned
❌ Other brokers, consultants, architects, contractors, or industry service providers

# YOUR TASK
Based solely on the call transcript, develop 3-5 detailed customer personas, complete journey maps for each persona, and a website sitemap.

# OUTPUT REQUIRED

Return your output as valid JSON in this EXACT structure:
{
  "persona_count": 3,
  "customer_personas": [
    {
      "persona_number": 1,
      "name": "John Smith",
      "age": 42,
      "location": "Detroit, MI",
      "description": "Oversees equipment performance and maintenance for a large automotive manufacturing plant. Values reliability and fast access to solutions when problems arise. Practical and focused on uptime.",
      "goals": [
        "Keep operations running with minimal downtime",
        "Extend equipment life and reduce maintenance costs",
        "Get support when unexpected failures happen",
        "Maintain production schedules without disruption"
      ],
      "pain_points": [
        "Unexpected equipment breakdowns causing costly production delays",
        "Unreliable suppliers who don't deliver on time",
        "Difficulty finding the right parts or products quickly during emergencies",
        "Lack of technical support when troubleshooting equipment issues"
      ],
      "communication_preferences": "Prefers direct phone calls for urgent issues, followed by email for quotes and order confirmations. Open to in-person visits from sales reps when building new supplier relationships. Values quick response times and technical expertise.",
      "hesitations": [
        "Concern about switching suppliers due to risk of delays or quality issues",
        "Worry about disrupting established procurement processes",
        "Uncertainty about whether new supplier can handle urgent requests"
      ],
      "transformation": "Gains peace of mind knowing this supplier provides the right products quickly, along with technical support to prevent failures. Becomes less reactive and more proactive in equipment maintenance.",
      "influencers": [
        "Reads Plant Engineering magazine for industry trends",
        "Active in Society for Maintenance & Reliability Professionals"
      ]
    }
  ],
  "customer_journeys": [
    {
      "persona_name": "John Smith (Maintenance Manager)",
      "persona_number": 1,
      "stages": {
        "awareness": {
          "touchpoints": [
            "Encounters company at regional manufacturing trade show booth",
            "Receives targeted LinkedIn outreach about equipment solutions"
          ],
          "actions": [
            "Browses the website to learn more about product offerings",
            "Picks up brochure or business card at trade show"
          ],
          "emotions": "Curious but skeptical. Wants to see if this supplier is credible and can actually deliver on promises. Cautious about switching from established vendors.",
          "opportunities": [
            "Simplify website navigation with clear product categories and search",
            "Highlight reliability and fast turnaround times on homepage"
          ]
        },
        "consideration": {
          "touchpoints": [
            "Reviews detailed product specifications and technical documentation",
            "Requests pricing quote from sales representative"
          ],
          "actions": [
            "Compares this supplier's offerings against current vendors",
            "Discusses options with maintenance team and procurement"
          ],
          "emotions": "Hopeful but uncertain about making a change. Concerned about the risk of disruption to operations if the switch doesn't work out.",
          "opportunities": [
            "Provide clear product comparisons showing advantages over competitors",
            "Share detailed case studies from similar manufacturing facilities"
          ]
        },
        "decision": {
          "touchpoints": [
            "Receives detailed quote with pricing and delivery timeline",
            "Gets follow-up call from sales rep to confirm needs"
          ],
          "actions": [
            "Submits purchase order or approves vendor setup internally",
            "Places initial order to test service and product quality"
          ],
          "emotions": "Relieved to have found a potential solution. Cautious and watching closely to see if the supplier delivers on promises.",
          "opportunities": [
            "Streamline onboarding with simple account setup process",
            "Follow up quickly after first order to ensure satisfaction"
          ]
        },
        "loyalty": {
          "touchpoints": [
            "Receives regular deliveries with consistent quality",
            "Gets periodic check-ins from dedicated sales representative"
          ],
          "actions": [
            "Places recurring orders on regular schedule",
            "Refers supplier to colleagues at other facilities"
          ],
          "emotions": "Confident in the supplier's reliability and value. Feels supported as a long-term customer and trusts the partnership.",
          "opportunities": [
            "Provide performance reports showing cost savings improvements",
            "Request testimonials and referrals from satisfied customers"
          ]
        }
      }
    }
  ],
  "sitemap": {
    "primary_pages": [
      "Home",
      "Services",
      "About",
      "Contact",
      "Resources"
    ],
    "secondary_pages": [
      "Privacy Policy",
      "Terms & Conditions",
      "Newsletter Signup",
      "Social Media Links (LinkedIn, Facebook, YouTube)",
      "Careers"
    ],
    "sub_pages": {
      "Resources": [
        "Case Studies",
        "Blog",
        "Industry Guides"
      ],
      "Services": [
        "Service Category 1",
        "Service Category 2"
      ]
    }
  }
}

CRITICAL: Return ONLY the JSON object with no explanations, preamble, or markdown formatting.`;

export async function generateProjectResources(transcript) {
  const userPrompt = `transcript : ${transcript}`;
  
  const result = await callOpenAIStructured(SYSTEM_MESSAGE, userPrompt);
  
  return result;
}

