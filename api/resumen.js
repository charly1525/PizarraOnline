export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { images } = req.body; 
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: 'La clave de API no está configurada.' });
    if (!images || images.length === 0) return res.status(400).json({ error: 'No se enviaron imágenes.' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // PROMPT ESTRICTO PARA MATEMÁTICAS Y DIAGRAMAS
    const prompt = `Eres un experto académico. Analiza las siguientes imágenes de apuntes. REGLAS ESTRICTAS E INQUEBRANTABLES:
    1. VE DIRECTO AL GRANO. CERO introducciones, saludos ni confirmaciones.
    2. Múltiples materias/temas: Identifica cambios de materia y titula usando Markdown (# Título, ## Subtítulo).
    3. MATEMÁTICAS OBLIGATORIAS: DEBES usar formato LaTeX (encerrado en $ para línea o $$ para bloque) para TODAS las fórmulas, ecuaciones, límites, integrales, fracciones, vectores, y símbolos matemáticos/griegos (ej. $\\lambda$, $\\lim_{x \\to 0}$, $\\vec{v}$). NUNCA uses texto plano para expresar matemáticas.
    4. DIAGRAMAS: Si hay mapas conceptuales o diagramas, tradúcelos a Mermaid.js envueltos en \`\`\`mermaid. 
       - Usa SIEMPRE 'graph TD' o 'graph LR'.
       - Los IDs de los nodos DEBEN ser solo letras mayúsculas (A, B, C). 
       - El texto del nodo DEBE ir entre comillas dobles: A["Texto del nodo"].
       - PROHIBIDO usar caracteres especiales (<, >, &, paréntesis anidados) dentro de los textos de los nodos.
    5. Transcribe, limpia y estructura el texto restante con viñetas.`;

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

        return res.status(200).json({ resumen: data.candidates[0].content.parts[0].text });

    } catch (error) {
        return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
}
