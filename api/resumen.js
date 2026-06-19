export default async function handler(req, res) {
    // Solo permitir peticiones POST (envío de datos)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { base64Image } = req.body;
    // Vercel tomará la clave de forma segura desde las Variables de Entorno
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: 'La clave de API no está configurada en el backend de Vercel.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = "Actúa como un profesor experto. Extrae todo el texto y conocimiento de esta imagen de una pizarra o apunte. Limpia el texto, corrige la ortografía, estructúralo lógicamente y genera un resumen en viñetas fácil de estudiar. Evita inventar datos que no estén en la foto.";

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }]
    };

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
        
        // Devolver el resumen limpio al frontend
        return res.status(200).json({ resumen: textoResumen });

    } catch (error) {
        return res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
}