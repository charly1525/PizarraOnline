export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { images } = req.body; // Ahora recibimos un arreglo de imágenes
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: 'La clave de API no está configurada.' });
    if (!images || images.length === 0) return res.status(400).json({ error: 'No se enviaron imágenes.' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // EL PROMPT MAESTRO (Prompt Engineering)
    // EL PROMPT MAESTRO (Prompt Engineering Blindado)
    const prompt = `Eres un experto académico. Analiza las siguientes imágenes de apuntes. REGLAS ESTRICTAS:
    1. VE DIRECTO AL GRANO. CERO introducciones, saludos ni confirmaciones.
    2. Múltiples materias/temas: Identifica cambios de materia y titula usando Markdown (# Título principal, ## Subtítulo).
    3. DIAGRAMAS (REGLAS VITALES): Si hay diagramas, tradúcelos a Mermaid.js envueltos en \`\`\`mermaid. 
       - Usa SIEMPRE 'graph TD'.
       - Los IDs de los nodos DEBEN ser solo letras (A, B, C). 
       - El texto de cada nodo DEBE estar OBLIGATORIAMENTE entre comillas dobles. 
       - Ejemplo perfecto: A["Concepto (con paréntesis)"] --> B["Concepto 2"]
    4. Transcribe, limpia y estructura el texto restante con viñetas.`;

    // Armar el payload dinámicamente con todas las imágenes que suba el usuario
    const parts = [{ text: prompt }];
    images.forEach(base64 => {
        parts.push({ inline_data: { mime_type: "image/jpeg", data: base64 } });
    });

    const payload = { contents: [{ parts }] };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        const textoResumen = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ resumen: textoResumen });

    } catch (error) {
        return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
}
