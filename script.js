// Referências aos elementos da interface
const recordBtn = document.getElementById('recordBtn');
const contentArea = document.getElementById('contentArea');
const tabOriginal = document.getElementById('tabOriginal');
const tabResumo = document.getElementById('tabResumo');

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Variáveis para guardar a resposta da IA
let textoOriginal = "";
let textoResumo = "";
let abaAtual = 'original';

// Sua chave de API
const API_KEY = "AQ.Ab8RN6KLEy2gDBkTB6L7AAJZ2tDWR1afz-sQJCoQmzu6Ulgadg";

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await iniciarGravacao();
    } else {
        pararGravacao();
    }
});

tabOriginal.addEventListener('click', () => mudarAba('original'));
tabResumo.addEventListener('click', () => mudarAba('resumo'));

async function iniciarGravacao() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            // Pegamos o formato exato que o seu celular usa (webm, mp4, etc)
            const formatoAudio = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: formatoAudio });
            
            await processarAudioComGemini(audioBlob, formatoAudio);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.classList.add('recording');
        contentArea.innerHTML = '<p class="placeholder-text" style="color: #ff3b30;">Gravando...</p>';
        textoOriginal = "";
        textoResumo = "";

    } catch (err) {
        alert("Erro ao acessar o microfone.");
        console.error(err);
    }
}

function pararGravacao() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('recording');
    }
}

// Passamos o formato do áudio como parâmetro agora
async function processarAudioComGemini(audioBlob, formatoAudio) {
    contentArea.innerHTML = '<p class="placeholder-text">Processando com IA... (Pode demorar uns segundos)</p>';

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        try {
            const base64AudioData = reader.result.split(',')[1];
            
            // Tratamento extra caso o celular inclua codecs no mimeType (ex: audio/webm;codecs=opus)
            // O Google prefere apenas a primeira parte
            const mimeTypeLimpo = formatoAudio.split(';')[0];

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const payload = {
                contents: [{
                    parts: [
                        { text: "Ouça este áudio. Aja como um assistente de anotações. Retorne EXATAMENTE um objeto JSON com duas propriedades: 'transcricaoCompleta' (contendo a transcrição exata, com pontuação) e 'resumoOrganizado' (contendo um resumo em tópicos, sem inventar informações)." },
                        { inlineData: { mimeType: mimeTypeLimpo, data: base64AudioData } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const erroDetalhado = await response.text();
                throw new Error(`Erro do Google: ${response.status} - ${erroDetalhado}`);
            }

            const data = await response.json();
            let respostaEmTexto = data.candidates[0].content.parts[0].text;

            // Limpeza de segurança: removemos crases e "json" caso a IA envie formatado como código Markdown
            respostaEmTexto = respostaEmTexto.replace(/```json/g, '').replace(/```/g, '').trim();

            const dadosFinais = JSON.parse(respostaEmTexto);

            textoOriginal = dadosFinais.transcricaoCompleta;
            textoResumo = dadosFinais.resumoOrganizado;
            atualizarTela();

        } catch (error) {
            console.error(error);
            // Agora o erro exato vai aparecer na sua tela!
            contentArea.innerHTML = `<p class="placeholder-text" style="color: #ff3b30; font-size: 14px; text-align: left;"><strong>Erro:</strong> ${error.message}</p>`;
        }
    };
}

function mudarAba(aba) {
    abaAtual = aba;
    if (aba === 'original') {
        tabOriginal.classList.add('active');
        tabResumo.classList.remove('active');
    } else {
        tabResumo.classList.add('active');
        tabOriginal.classList.remove('active');
    }
    atualizarTela();
}

function atualizarTela() {
    if (!textoOriginal && !textoResumo) {
        contentArea.innerHTML = '<p class="placeholder-text">Toque no botão abaixo para gravar.</p>';
        return;
    }
    if (abaAtual === 'original') {
        contentArea.innerHTML = textoOriginal;
    } else {
        contentArea.innerHTML = textoResumo;
    }
}
