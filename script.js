const recordBtn = document.getElementById('recordBtn');
const contentArea = document.getElementById('contentArea');

let recognition;
let isRecording = false;
let transcricao = "";

// Verifica suporte do navegador
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    contentArea.innerHTML = '<p class="placeholder-text" style="color:#ff3b30;">Seu navegador não suporta transcrição. Use o Chrome.</p>';
    recordBtn.disabled = true;
}

recordBtn.addEventListener('click', () => {
    if (!isRecording) {
        iniciarGravacao();
    } else {
        pararGravacao();
    }
});

function iniciarGravacao() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = true;       // continua gravando sem parar
    recognition.interimResults = true;   // mostra texto enquanto fala

    recognition.onstart = () => {
        isRecording = true;
        recordBtn.classList.add('recording');
        if (!transcricao) {
            contentArea.innerHTML = '<p class="placeholder-text" style="color:#ff3b30;">Gravando... fale agora.</p>';
        }
    };

    recognition.onresult = (event) => {
        let textoFinal = "";
        let textoTemporario = "";

        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                textoFinal += event.results[i][0].transcript + " ";
            } else {
                textoTemporario += event.results[i][0].transcript;
            }
        }

        transcricao = textoFinal;
        contentArea.innerHTML = `<span style="color:#ffffff">${transcricao}</span><span style="color:rgba(255,255,255,0.4)">${textoTemporario}</span>`;
    };

    recognition.onerror = (event) => {
        console.error('Erro:', event.error);
        if (event.error === 'not-allowed') {
            contentArea.innerHTML = '<p class="placeholder-text" style="color:#ff3b30;">Permissão de microfone negada.</p>';
        }
        pararGravacao();
    };

    recognition.onend = () => {
        // Se ainda deveria estar gravando, reinicia automaticamente
        if (isRecording) {
            recognition.start();
        }
    };

    recognition.start();
}

function pararGravacao() {
    isRecording = false;
    recordBtn.classList.remove('recording');
    if (recognition) {
        recognition.stop();
    }
    if (!transcricao) {
        contentArea.innerHTML = '<p class="placeholder-text">Toque no botão abaixo para gravar.</p>';
    }
}
