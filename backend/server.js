const express = require("express");
const multer = require("multer");
const cors = require("cors");
const vision = require("@google-cloud/vision");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ["https://gen-ai-hackathon-472505.web.app","http://127.0.0.1:5500", "null"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Google Cloud Vision client
let visionClient;
try {
  visionClient = new vision.ImageAnnotatorClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  });
  console.log("✅ Vision API initialized successfully");
} catch (err) {
  console.error("❌ Vision API init failed:", err.message);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Enhanced cultural heritage database
const CULTURAL_HERITAGE = {
  "Textiles": {
    regions: ["Varanasi", "Kanchipuram", "Pochampally", "Chanderi", "Maheshwar"],
    traditions: ["Hand-weaving passed down through generations", "Natural dyeing techniques", "Intricate brocade work"],
    significance: "Textiles represent India's rich weaving traditions, with each region having unique patterns and techniques perfected over centuries."
  },
  "Pottery": {
    regions: ["Khurja", "Jaipur", "Kumartuli", "Nizamabad"],
    traditions: ["Potter's wheel mastery", "Traditional kiln firing", "Natural clay preparation"],
    significance: "Pottery is one of India's oldest crafts, representing the earth element and sustainable living practices."
  },
  "Jewelry": {
    regions: ["Jaipur", "Kolkata", "Chennai", "Mumbai"],
    traditions: ["Kundan work", "Meenakari", "Temple jewelry", "Tribal silver work"],
    significance: "Indian jewelry craftsmanship reflects spiritual beliefs, royal heritage, and regional artistic expressions."
  },
  "Wood Carving": {
    regions: ["Saharanpur", "Channapatna", "Kerala", "Rajasthan"],
    traditions: ["Intricate relief carving", "Inlay work", "Painted wooden toys"],
    significance: "Wood carving represents harmony with nature and showcases India's architectural and artistic legacy."
  },
  "Metal Work": {
    regions: ["Moradabad", "Jaipur", "Tamil Nadu", "Kerala"],
    traditions: ["Brass work", "Bell metal crafting", "Bronze casting", "Bidriware"],
    significance: "Metal craft demonstrates India's ancient metallurgy knowledge and artistic excellence."
  }
};

// Market trends data (simulated - in production, this would come from APIs)
const MARKET_TRENDS = {
  "Textiles": {
    trending_keywords: ["sustainable fashion", "handloom", "eco-friendly", "artisan made", "slow fashion"],
    seasonal_demand: "High during festival seasons and wedding months",
    target_demographics: ["Conscious consumers", "Fashion enthusiasts", "Cultural preservationists"],
    price_range: "₹2000-₹50000 depending on complexity and materials"
  },
  "Pottery": {
    trending_keywords: ["handmade ceramics", "artisan pottery", "home decor", "sustainable living"],
    seasonal_demand: "Peak during home renovation seasons and festivals",
    target_demographics: ["Home decorators", "Art collectors", "Eco-conscious buyers"],
    price_range: "₹500-₹15000 based on size and artistic complexity"
  },
  "Jewelry": {
    trending_keywords: ["traditional jewelry", "handcrafted", "ethnic wear", "statement pieces"],
    seasonal_demand: "High during wedding season and festivals",
    target_demographics: ["Brides", "Fashion enthusiasts", "Cultural jewelry lovers"],
    price_range: "₹1500-₹100000 depending on materials and craftsmanship"
  },
  "Wood Carving": {
    trending_keywords: ["handmade woodwork", "artisan furniture", "decorative items", "sustainable wood"],
    seasonal_demand: "Steady with peaks during home decoration seasons",
    target_demographics: ["Home decorators", "Art collectors", "Eco-conscious buyers"],
    price_range: "₹1000-₹25000 based on size and complexity"
  },
  "Metal Work": {
    trending_keywords: ["handcrafted metal", "traditional utensils", "decorative items", "artisan metalwork"],
    seasonal_demand: "High during festivals and wedding seasons",
    target_demographics: ["Traditional households", "Art collectors", "Gift buyers"],
    price_range: "₹800-₹20000 depending on materials and craftsmanship"
  }
};

async function callGemini(prompt, maxTokens = 500) {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
}

// Enhanced endpoints with cultural context and market trends

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to KraftAI Backend API",
    version: "2.1.0",
    features: ["Cultural Heritage Integration", "Market Trend Analysis", "Image-Based Pricing", "Vision AI Analysis"],
    endpoints: {
      health: "/api/health",
      generateDescription: "/api/generate-description",
      generateStory: "/api/generate-story", 
      generatePricing: "/api/generate-pricing",
      generatePricingFromImage: "/api/generate-pricing-from-image",
      generateInsights: "/api/generate-insights",
      generateSocialContent: "/api/generate-social-content",
      analyzeImage: "/api/analyze-image",
      getCulturalContext: "/api/cultural-context",
      getMarketTrends: "/api/market-trends"
    },
    status: "running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      project: process.env.GOOGLE_CLOUD_PROJECT_ID || "unknown",
      apis: { gemini: !!GEMINI_API_KEY, vision: !!visionClient },
      server: { uptime: process.uptime(), version: process.version },
      features: ["Enhanced Cultural Context", "Market Intelligence", "Trend Integration", "Image-Based Pricing"]
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post("/api/generate-description", async (req, res) => {
  try {
    const d = req.body;
    const heritage = CULTURAL_HERITAGE[d.category] || {};
    const trends = MARKET_TRENDS[d.category] || {};
    
    const prompt = `Write a compelling, SEO-optimized product description for "${d.productName}" crafted by ${d.artisanName}.

Category: ${d.category}
Materials: ${d.materials || "Traditional materials"}
Time spent: ${d.timeSpent || "Handcrafted with patience"}
Location: ${d.location || "India"}

CULTURAL CONTEXT: ${heritage.significance || "Rich traditional craftsmanship"}
TRENDING KEYWORDS to incorporate: ${(trends.trending_keywords || []).join(", ")}
TARGET AUDIENCE: ${(trends.target_demographics || []).join(", ")}

Focus on:
1. Cultural heritage and traditional techniques
2. Sustainability and eco-friendliness
3. Unique artisan story
4. Quality and authenticity
5. Modern relevance and style

Make it compelling for both traditional craft lovers and modern consumers.`;

    const text = await callGemini(prompt, 600);
    res.json({ 
      success: true, 
      description: text,
      cultural_context: heritage,
      market_trends: trends
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/generate-story", async (req, res) => {
  try {
    const d = req.body;
    const heritage = CULTURAL_HERITAGE[d.category] || {};
    
    const prompt = `Tell an inspiring, authentic story about ${d.artisanName}, the master craftsperson behind "${d.productName}".

Artisan Details:
- Experience: ${d.experience || "Years of dedication"} 
- Location: ${d.location || "India"}
- Craft: ${d.category}

CULTURAL HERITAGE TO WEAVE IN:
- Regional significance: ${heritage.regions ? heritage.regions.join(", ") : "Traditional craft regions"}
- Traditional techniques: ${heritage.traditions ? heritage.traditions.join(", ") : "Time-honored methods"}
- Cultural importance: ${heritage.significance || "Rich artistic legacy"}

Create a narrative that:
1. Connects the artisan's personal journey with cultural heritage
2. Explains how traditional techniques are preserved and adapted
3. Shows the bridge between ancient craftsmanship and modern relevance  
4. Highlights the sustainability and authenticity of handmade crafts
5. Makes readers appreciate both the artisan and the cultural tradition

Make it emotionally engaging and culturally rich.`;

    const text = await callGemini(prompt, 700);
    res.json({ 
      success: true, 
      story: text,
      cultural_heritage: heritage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/generate-pricing", async (req, res) => {
  try {
    const d = req.body;
    const trends = MARKET_TRENDS[d.category] || {};
    
    const prompt = `Provide competitive pricing analysis and suggestions for "${d.productName}" by ${d.artisanName}.

Product Details:
- Category: ${d.category}
- Materials: ${d.materials || "Traditional materials"}
- Time invested: ${d.timeSpent || "Handcrafted"}
- Artisan experience: ${d.experience || "Skilled craftsperson"}
- Location: ${d.location || "India"}

MARKET CONTEXT:
- Typical price range: ${trends.price_range || "Market competitive"}
- Target buyers: ${(trends.target_demographics || []).join(", ")}
- Seasonal demand: ${trends.seasonal_demand || "Steady demand"}

Provide:
1. Suggested retail price with justification
2. Cost breakdown (materials, labor, overhead, profit)
3. Competitive positioning strategy
4. Pricing for different market segments (local, national, international)
5. Seasonal pricing recommendations
6. Value proposition that justifies the price

Consider fair compensation for artisan labor, material costs, cultural value, and market positioning.`;

    const text = await callGemini(prompt, 600);
    res.json({ 
      success: true, 
      pricing: text,
      market_analysis: trends
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// NEW: Image-based pricing endpoint
app.post("/api/generate-pricing-from-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No image provided" });

    let imageAnalysisData;
    let detectedCategory = "Other";
    let materials = [];
    let complexity = "Medium";
    let estimatedSize = "Medium";
    let labels = [];

    // Check if frontend sent analysis data
    if (req.body.imageAnalysis) {
      try {
        imageAnalysisData = JSON.parse(req.body.imageAnalysis);
        console.log('Received frontend analysis:', imageAnalysisData);
        
        // Use frontend analysis data
        detectedCategory = imageAnalysisData.suggested_category || "Other";
        labels = imageAnalysisData.labels || [];
        
        // Extract complexity and materials from frontend analysis
        const complexityIndicators = labels.filter(label => 
          ["intricate", "detailed", "ornate", "decorative", "pattern", "design", "carved", "embroidered", "handmade", "artisan"]
            .some(indicator => label.description.toLowerCase().includes(indicator.toLowerCase()))
        );
        
        if (complexityIndicators.length > 3) complexity = "High";
        else if (complexityIndicators.length > 1) complexity = "Medium";
        else complexity = "Simple";

        // Extract materials
        const craftKeywords = {
          "Textiles": { materials: ["silk", "cotton", "wool", "linen", "fabric"] },
          "Pottery": { materials: ["clay", "ceramic", "terracotta", "earthenware"] },
          "Jewelry": { materials: ["gold", "silver", "brass", "copper", "beads", "metal"] },
          "Wood Carving": { materials: ["teak", "rosewood", "sandalwood", "pine", "wood"] },
          "Metal Work": { materials: ["brass", "bronze", "copper", "silver", "iron", "metal"] }
        };

        const categoryData = craftKeywords[detectedCategory];
        if (categoryData) {
          materials = labels
            .filter(label => categoryData.materials.some(mat => 
              label.description.toLowerCase().includes(mat.toLowerCase())))
            .map(label => label.description);
        }

        console.log('Processed analysis:', { detectedCategory, complexity, materials });
        
      } catch (parseError) {
        console.error('Error parsing frontend analysis:', parseError);
        // Fall back to backend analysis
        imageAnalysisData = null;
      }
    }

    // If no frontend analysis, do backend analysis
    if (!imageAnalysisData && visionClient) {
      console.log('Performing backend image analysis...');
      const [visionResult] = await visionClient.annotateImage({
        image: { content: req.file.buffer.toString("base64") },
        features: [
          { type: "LABEL_DETECTION", maxResults: 15 },
          { type: "TEXT_DETECTION" },
          { type: "OBJECT_LOCALIZATION", maxResults: 10 },
          { type: "IMAGE_PROPERTIES" }
        ]
      });

      labels = (visionResult.labelAnnotations || []).map(l => ({
        description: l.description,
        score: l.score,
        confidence: Math.round(l.score * 100)
      }));

      // Process backend analysis (existing logic)
      const craftKeywords = {
        "Textiles": {
          keywords: ["fabric", "textile", "cloth", "weaving", "embroidery", "silk", "cotton", "saree", "dupatta", "clothing", "dress"],
          materials: ["silk", "cotton", "wool", "linen", "fabric"],
          basePrice: { min: 2000, max: 50000 }
        },
        "Pottery": {
          keywords: ["pottery", "ceramic", "clay", "pot", "vessel", "earthenware", "vase", "bowl", "mug", "plate"],
          materials: ["clay", "ceramic", "terracotta", "earthenware"],
          basePrice: { min: 500, max: 15000 }
        },
        "Jewelry": {
          keywords: ["jewelry", "necklace", "bracelet", "earrings", "ornament", "accessory", "gold", "silver", "pendant", "ring"],
          materials: ["gold", "silver", "brass", "copper", "beads", "metal"],
          basePrice: { min: 1500, max: 100000 }
        },
        "Wood Carving": {
          keywords: ["wood", "carving", "sculpture", "wooden", "timber", "furniture", "table", "chair", "frame"],
          materials: ["teak", "rosewood", "sandalwood", "pine", "wood"],
          basePrice: { min: 1000, max: 25000 }
        },
        "Metal Work": {
          keywords: ["metal", "brass", "bronze", "silver", "copper", "metalwork", "utensil", "bowl", "plate", "lamp"],
          materials: ["brass", "bronze", "copper", "silver", "iron", "metal"],
          basePrice: { min: 800, max: 20000 }
        }
      };

      // Detect category and materials from image labels
      for (const [category, data] of Object.entries(craftKeywords)) {
        if (labels.some(label => 
          data.keywords.some(keyword => 
            label.description.toLowerCase().includes(keyword.toLowerCase())
          )
        )) {
          detectedCategory = category;
          // Extract materials
          materials = labels
            .filter(label => data.materials.some(mat => 
              label.description.toLowerCase().includes(mat.toLowerCase())))
            .map(label => label.description);
          break;
        }
      }

      // Analyze complexity based on labels and objects
      const complexityIndicators = labels.filter(label => 
        ["intricate", "detailed", "ornate", "decorative", "pattern", "design", "carved", "embroidered", "handmade", "artisan"]
          .some(indicator => label.description.toLowerCase().includes(indicator.toLowerCase()))
      );
      
      if (complexityIndicators.length > 3) complexity = "High";
      else if (complexityIndicators.length > 1) complexity = "Medium";
      else complexity = "Simple";

      // Estimate size from objects detected
      const objects = visionResult.localizedObjectAnnotations || [];
      if (objects.length > 0) {
        const avgSize = objects.reduce((sum, obj) => {
          const box = obj.boundingPoly.normalizedVertices;
          const width = Math.abs(box[1].x - box[0].x);
          const height = Math.abs(box[2].y - box[1].y);
          return sum + (width * height);
        }, 0) / objects.length;
        
        if (avgSize > 0.5) estimatedSize = "Large";
        else if (avgSize > 0.2) estimatedSize = "Medium";
        else estimatedSize = "Small";
      }
    }

    // Get form data if provided
    const formData = req.body;
    const artisanName = formData.artisanName || "Artisan";
    const productName = formData.productName || "Handcrafted Item";
    const location = formData.location || "India";
    const experience = formData.experience || "Skilled craftsperson";

    // Get market trends for detected category
    const trends = MARKET_TRENDS[detectedCategory] || {};
    const heritage = CULTURAL_HERITAGE[detectedCategory] || {};

    // Create comprehensive pricing prompt with CONFIRMED analysis
    const prompt = `You are providing pricing for a REAL craft item that has been analyzed. Use this CONFIRMED analysis data:

VISUAL ANALYSIS COMPLETED:
- Confirmed Category: ${detectedCategory}
- Complexity Level: ${complexity}
- Estimated Size: ${estimatedSize}
- Materials Identified: ${materials.length ? materials.join(", ") : "Traditional materials"}
- Key Visual Features: ${labels.slice(0, 8).map(l => l.description).join(", ")}
- Analysis Confidence: ${labels.length > 0 ? Math.round(labels[0].confidence || 0) : 'High'}%

PRODUCT DETAILS:
- Item Name: ${productName}
- Artisan: ${artisanName}
- Location: ${location}
- Experience: ${experience}

MARKET CONTEXT:
- Category Price Range: ${trends.price_range || "₹500-₹15000"}
- Target Market: ${(trends.target_demographics || []).join(", ")}

CULTURAL SIGNIFICANCE:
${heritage.significance || "Traditional Indian craftsmanship"}

Based on this CONFIRMED visual analysis, provide specific pricing recommendations:

1. **Exact Price Recommendation**: Based on ${complexity} complexity and ${estimatedSize} size
2. **Visual Quality Assessment**: What the analysis reveals about craftsmanship quality
3. **Material Value**: Pricing impact of identified materials: ${materials.join(", ") || "traditional materials"}
4. **Complexity Premium**: How ${complexity} complexity affects pricing
5. **Market Positioning**: Specific positioning in ${detectedCategory} market

Provide concrete numbers and specific recommendations based on the confirmed analysis data.`;

    // Generate pricing using Gemini
    const pricingText = await callGemini(prompt, 800);

    // Send comprehensive response
    res.json({
      success: true,
      pricing: pricingText,
      image_analysis: {
        detected_category: detectedCategory,
        materials_found: materials,
        complexity_level: complexity,
        estimated_size: estimatedSize,
        key_features: labels.slice(0, 10),
        confidence_score: labels.length > 0 ? Math.round(labels[0]?.confidence || 0) : 0,
        data_source: imageAnalysisData ? 'frontend' : 'backend'
      },
      market_context: trends,
      cultural_heritage: heritage
    });

  } catch (err) {
    console.error("Error in image-based pricing:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to analyze image and generate pricing",
      details: err.message 
    });
  }
});

app.post("/api/generate-insights", async (req, res) => {
  try {
    const d = req.body;
    const heritage = CULTURAL_HERITAGE[d.category] || {};
    const trends = MARKET_TRENDS[d.category] || {};
    
    const prompt = `Provide comprehensive market insights for "${d.productName}" in the ${d.category} category.

CURRENT MARKET LANDSCAPE:
- Trending keywords: ${(trends.trending_keywords || []).join(", ")}
- Target demographics: ${(trends.target_demographics || []).join(", ")}
- Seasonal patterns: ${trends.seasonal_demand || "Analyze seasonal trends"}

CULTURAL POSITIONING:
- Heritage regions: ${heritage.regions ? heritage.regions.join(", ") : "Traditional regions"}
- Cultural significance: ${heritage.significance || "Rich cultural value"}

Analyze:
1. Market opportunities for traditional crafts in digital marketplace
2. Consumer behavior trends favoring handmade/sustainable products
3. Challenges faced by traditional artisans in modern markets
4. Strategies to bridge traditional craftsmanship with contemporary preferences
5. Digital marketing opportunities and platforms
6. Export potential and international market interest
7. Collaboration opportunities with modern designers/brands
8. Sustainability trends favoring traditional crafts

Provide actionable recommendations for expanding market reach while preserving cultural authenticity.`;

    const text = await callGemini(prompt, 800);
    res.json({ 
      success: true, 
      insights: text,
      market_data: trends,
      cultural_context: heritage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/generate-social-content", async (req, res) => {
  try {
    const d = req.body;
    const platform = d.platform || "general";
    const heritage = CULTURAL_HERITAGE[d.category] || {};
    const trends = MARKET_TRENDS[d.category] || {};
    
    const platformSpecs = {
      instagram: "Visual-first, use hashtags, engaging captions, story-worthy",
      facebook: "Community-focused, longer descriptions, shareable content",  
      twitter: "Concise, trending hashtags, conversation starters"
    };
    
    const prompt = `Create an engaging ${platform} post for "${d.productName}" by ${d.artisanName}.

Product: ${d.category} craft
Cultural heritage: ${heritage.significance || "Traditional Indian craftsmanship"}
Trending themes: ${(trends.trending_keywords || []).join(", ")}

Platform requirements: ${platformSpecs[platform] || "Engaging social media content"}

Include:
1. Compelling hook that bridges tradition with modernity
2. Cultural storytelling element
3. Sustainability/authenticity angle
4. Relevant hashtags including trending keywords
5. Call-to-action that encourages engagement
6. Cultural pride and heritage appreciation

Make it authentic, engaging, and culturally respectful while appealing to modern digital audiences.`;

    const text = await callGemini(prompt, 400);
    res.json({ 
      success: true, 
      content: text,
      suggested_hashtags: trends.trending_keywords || [],
      cultural_hooks: heritage.traditions || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// New endpoints for enhanced features
app.get("/api/cultural-context/:category", (req, res) => {
  const category = req.params.category;
  const heritage = CULTURAL_HERITAGE[category];
  
  if (!heritage) {
    return res.status(404).json({
      success: false,
      error: "Cultural context not found for this category"
    });
  }
  
  res.json({
    success: true,
    category: category,
    cultural_heritage: heritage
  });
});

app.get("/api/market-trends/:category", (req, res) => {
  const category = req.params.category;
  const trends = MARKET_TRENDS[category];
  
  if (!trends) {
    return res.status(404).json({
      success: false,
      error: "Market trends not found for this category"
    });
  }
  
  res.json({
    success: true,
    category: category,
    market_trends: trends
  });
});

app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No image provided" });
    if (!visionClient) throw new Error("Vision API client not initialized");

    const [result] = await visionClient.annotateImage({
      image: { content: req.file.buffer.toString("base64") },
      features: [
        { type: "LABEL_DETECTION", maxResults: 10 },
        { type: "TEXT_DETECTION" },
        { type: "OBJECT_LOCALIZATION", maxResults: 10 },
        { type: "SAFE_SEARCH_DETECTION" }
      ]
    });

    // Enhanced analysis with cultural context suggestions
    const labels = (result.labelAnnotations || []).map(l => ({
      description: l.description,
      score: l.score,
      confidence: Math.round(l.score * 100)
    }));

    // Suggest category based on detected labels
    let suggestedCategory = "Other";
    const craftKeywords = {
      "Textiles": ["fabric", "textile", "cloth", "weaving", "embroidery", "silk", "cotton"],
      "Pottery": ["pottery", "ceramic", "clay", "pot", "vessel", "earthenware"],
      "Jewelry": ["jewelry", "necklace", "bracelet", "earrings", "ornament", "accessory"],
      "Wood Carving": ["wood", "carving", "sculpture", "wooden", "timber"],
      "Metal Work": ["metal", "brass", "bronze", "silver", "copper", "metalwork"]
    };

    for (const [category, keywords] of Object.entries(craftKeywords)) {
      if (labels.some(label => 
        keywords.some(keyword => 
          label.description.toLowerCase().includes(keyword.toLowerCase())
        )
      )) {
        suggestedCategory = category;
        break;
      }
    }

    res.json({
      success: true,
      analysis: {
        labels: labels,
        text: result.textAnnotations?.[0]?.description || null,
        objects: (result.localizedObjectAnnotations || []).map(o => ({
          name: o.name,
          score: o.score,
          confidence: Math.round(o.score * 100),
          boundingBox: o.boundingPoly
        })),
        safeSearch: result.safeSearchAnnotation || {},
        suggested_category: suggestedCategory,
        cultural_context: CULTURAL_HERITAGE[suggestedCategory] || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Error handlers
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error", message: err.message });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

app.listen(port, () => {
  console.log(`🚀 KraftAI Enhanced Server running on port ${port}`);
  console.log(`📈 Features: Cultural Heritage Integration, Market Trends, Image-Based Pricing`);
  if (process.env.NODE_ENV === "production") {
    console.log(`🔗 API Base URL: https://${process.env.GOOGLE_CLOUD_PROJECT_ID}.uc.r.appspot.com`);
  } else {
    console.log(`🔗 Local URL: http://localhost:${port}`);
  }
});

module.exports = app;