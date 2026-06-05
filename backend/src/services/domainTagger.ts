/**
 * Domain Tagger — maps proposal text to one or more of nine academic domains.
 * Requirements: 15.1–15.6, 19.1
 */

export const VALID_DOMAINS = [
    'web',
    'mobile',
    'ai_ml',
    'iot',
    'cybersecurity',
    'data_science',
    'cloud',
    'blockchain',
    'ar_vr',
] as const;

export type Domain = (typeof VALID_DOMAINS)[number];

/**
 * Result of domain detection, including confidence and matched keywords.
 */
export interface DomainResult {
  /** The detected domain string, always from VALID_DOMAINS or 'general'. */
  domain: string;
  /** Confidence score in [0.0, 1.0] — ratio of matched to total domain keywords. */
  confidence: number;
  /** The keywords from the domain dictionary that were found in the text. */
  keywords: string[];
}

/**
 * Keyword dictionary: at least 5 keywords per domain (Requirement 15.2).
 * All keywords are lowercase.
 */
export const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
    web: [
        'html', 'css', 'javascript', 'react', 'angular', 'vue', 'nodejs',
        'rest', 'graphql', 'frontend', 'backend', 'api', 'django', 'flask',
        'express', 'http', 'browser', 'spa', 'pwa', 'typescript',
    ],
    mobile: [
        'android', 'ios', 'flutter', 'react native', 'swift', 'kotlin',
        'mobile app', 'xamarin', 'phonegap', 'capacitor', 'apk', 'mobile',
        'smartphone', 'tablet',
    ],
    ai_ml: [
        'machine learning', 'deep learning', 'neural network', 'lstm', 'cnn',
        'artificial intelligence', 'nlp', 'natural language', 'classification',
        'regression', 'clustering', 'tensorflow', 'pytorch', 'scikit', 'ai',
        'reinforcement learning', 'transformer', 'bert', 'gpt', 'prediction',
        'stock price prediction', 'image recognition', 'computer vision',
    ],
    iot: [
        'iot', 'internet of things', 'sensor', 'mqtt', 'arduino', 'raspberry pi',
        'embedded', 'microcontroller', 'smart home', 'smart irrigation',
        'smart city', 'rfid', 'wearable', 'zigbee', 'actuator',
    ],
    cybersecurity: [
        'security', 'encryption', 'firewall', 'intrusion detection', 'vulnerability',
        'penetration testing', 'malware', 'phishing', 'authentication',
        'authorization', 'cryptography', 'cybersecurity', 'ddos', 'owasp',
        'zero trust', 'ssl', 'tls', 'hashing',
    ],
    data_science: [
        'data science', 'data analysis', 'pandas', 'numpy', 'matplotlib',
        'visualization', 'big data', 'spark', 'hadoop', 'etl', 'sql',
        'nosql', 'database', 'data pipeline', 'statistics', 'analytics',
        'tableau', 'power bi', 'data warehouse',
    ],
    cloud: [
        'cloud', 'aws', 'azure', 'gcp', 'google cloud', 'kubernetes',
        'docker', 'microservices', 'serverless', 'lambda', 'devops',
        'ci/cd', 'terraform', 'infrastructure', 'saas', 'paas', 'iaas',
        'container', 'orchestration',
    ],
    blockchain: [
        'blockchain', 'smart contract', 'ethereum', 'solidity', 'nft',
        'defi', 'cryptocurrency', 'bitcoin', 'distributed ledger', 'web3',
        'token', 'consensus', 'ipfs', 'hyperledger', 'decentralized',
    ],
    ar_vr: [
        'augmented reality', 'virtual reality', 'ar', 'vr', 'mixed reality',
        'metaverse', 'unity', 'unreal engine', 'oculus', 'hololens',
        'xr', 'extended reality', '3d', 'immersive', 'hologram',
    ],
};

/**
 * Tags a text string with matching academic domains.
 * Returns empty array if no domain keywords are found.
 * Never throws (Requirement 15.5).
 *
 * @param text - Combined proposal title + description
 * @returns Array of domain strings, each from VALID_DOMAINS (Requirement 15.6)
 */
export function tagDomains(text: string): string[] {
    if (!text) return [];

    try {
        const lower = text.toLowerCase();
        const matched: string[] = [];

        for (const domain of VALID_DOMAINS) {
            const keywords = DOMAIN_KEYWORDS[domain];
            const hasMatch = keywords.some((kw) => lower.includes(kw));
            if (hasMatch) {
                matched.push(domain);
            }
        }

        return matched;
    } catch {
        return [];
    }
}

/**
 * Detects the single best-matching domain for a text string,
 * returning a DomainResult with confidence score and matched keywords.
 * Falls back to { domain: 'general', confidence: 0, keywords: [] } when nothing matches.
 * Never throws.
 */
export function extractDomain(text: string): DomainResult {
    if (!text) {
        return { domain: 'general', confidence: 0, keywords: [] };
    }

    try {
        const lower = text.toLowerCase();
        let bestDomain: string = 'general';
        let bestScore = 0;
        let bestKeywords: string[] = [];

        for (const domain of VALID_DOMAINS) {
            const keywords = DOMAIN_KEYWORDS[domain];
            const matched = keywords.filter((kw) => lower.includes(kw));
            const score = matched.length / keywords.length; // confidence = ratio
            if (matched.length > 0 && score > bestScore) {
                bestScore = score;
                bestDomain = domain;
                bestKeywords = matched;
            }
        }

        return {
            domain: bestDomain,
            confidence: parseFloat(bestScore.toFixed(4)),
            keywords: bestKeywords,
        };
    } catch {
        return { domain: 'general', confidence: 0, keywords: [] };
    }
}
