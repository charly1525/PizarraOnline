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
    const prompt = `Eres un experto académico. Analiza las siguientes imágenes de apuntes. REGLAS ESTRICTAS:
    1. VE DIRECTO AL GRANO. CERO introducciones, saludos ni confirmaciones (No digas "Aquí tienes...", empieza directamente con el contenido).
    2. Múltiples materias/temas: Evalúa si las imágenes pertenecen a la misma materia o a diferentes. Agrupa y titula el contenido estructuradamente indicando los cambios de materia.
    3. Títulos: Usa Markdown estándar (# Título principal, ## Subtítulo).
    4. DIAGRAMAS: Si en la imagen detectas mapas conceptuales, diagramas de flujo o esquemas lógicos, DEBES traducirlos estrictamente a sintaxis de Mermaid.js, envolviéndolo en un bloque \`\`\`mermaid [código] \`\`\`.
    5. Transcribe, limpia y estructura el texto restante con viñetas para facilitar el estudio.`;

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
