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

// ⚠️ Sua chave de API aplicada diretamente no frontend (Apenas para testes!)
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
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processarAudioComGemini(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.classList.add('recording');
        contentArea.innerHTML = '<p class="placeholder-text" style="color: #ff3b30;">Gravando...</p>';
        textoOriginal = "";
        textoResumo = "";

    } catch (err) {
        alert("Erro ao acessar o microfone. Verifique as permissões do navegador no seu celular.");
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

// 🧠 NOVA FUNÇÃO: Conversa direto com o Google sem precisar do Node.js
async function processarAudioComGemini(audioBlob) {
    contentArea.innerHTML = '<p class="placeholder-text">Processando com IA... (Pode demorar uns segundos)</p>';

    // 1. O Google pede que o áudio seja enviado em texto (Base64). Vamos converter o Blob:
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        try {
            // O resultado do reader vem assim: "data:audio/webm;base64,GkXfo59ChoEB..."
            // Nós só queremos a parte depois da vírgula.
            const base64AudioData = reader.result.split(',')[1];

            // 2. Montamos o pacote de dados para enviar via Internet (REST API)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const payload = {
                contents: [{
                    parts: [
                        { text: "Ouça este áudio. Aja como um assistente de anotações. Retorne EXATAMENTE um objeto JSON com duas propriedades: 'transcricaoCompleta' (contendo a transcrição exata, com pontuação) e 'resumoOrganizado' (contendo um resumo em tópicos, sem inventar informações)." },
                        { inlineData: { mimeType: "audio/webm", data: base64AudioData } }
                    ]
                }],
                generationConfig: { responseMimeType: "application/json" }
            };

            // 3. Disparamos a requisição direta para o Google
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Erro na comunicação com a API do Gemini.');

            const data = await response.json();

            // 4. A resposta vem dentro de um caminho específico no JSON do Google
            const respostaEmTexto = data.candidates[0].content.parts[0].text;
            const dadosFinais = JSON.parse(respostaEmTexto);

            // 5. Guardamos e atualizamos a tela
            textoOriginal = dadosFinais.transcricaoCompleta;
            textoResumo = dadosFinais.resumoOrganizado;
            atualizarTela();

        } catch (error) {
            console.error(error);
            contentArea.innerHTML = '<p class="placeholder-text" style="color: #ff3b30;">Erro ao processar áudio com a IA.</p>';
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
