# 💡 Ideias App — Workspace Criativo, Moodboards & Roteirização Inteligente

![React Native](https://img.shields.io/badge/React_Native-0.73+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-50+-000000?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Kotlin](https://img.shields.io/badge/Kotlin-Android_Native-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Sync-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Engine-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

---

## 📌 1. Título e Descrição Geral

O **Ideias App** é uma plataforma mobile (React Native/Expo) focada no fluxo criativo de criadores de conteúdo, roteiristas, designers e produtores audiovisuais. O aplicativo resolve a dispersão de referências e anotações, centralizando em um único ambiente:
* **Moodboards Interativos**: Canvas livre para arrastar, redimensionar e organizar notas, cartões e mídias.
* **Gestão e Roteirização de Cenas**: Divisão estruturada de roteiros, status de produção, ordenação e exportação de scripts em PDF.
* **Captura Rápida via Widget Nativo**: Módulo Android customizado em Kotlin para gravação de voz e criação de ideias diretamente da tela inicial.
* **Assistência com Inteligência Artificial**: Integração com a API do Google Gemini para reestruturar notas e gerar roteiros completos de cenas a partir de prompts em texto.

---

## 🛠️ 2. Tecnologias Identificadas

### **Frontend & Mobile Core**
* **Framework**: React Native com Expo (Managed Workflow + Prebuild Nativo).
* **Linguagem**: TypeScript.
* **UI & Estilização**: Componentes customizados, suporte a temas (Light/Dark), Rich Text / HTML Overlay.
* **Mídias & PDF**: `react-native-html-to-pdf`, visualizadores de vídeo, extrator de paleta de cores.

### **Módulo Nativo Customizado (Android Widget)**
* **Linguagem**: Kotlin (`modules/ideias-widget/`).
* **Recursos**: `AppWidgetProvider`, `RecordingService` (gravação em segundo plano), `BroadcastReceiver`, layouts XML Android nativos.

### **Backend, Banco de Dados & Sincronização**
* **Nuvem**: Supabase (PostgreSQL, Autenticação, Armazenamento).
* **Banco de Dados Local**: Local Storage / SQLite (`db.ts`) com mecanismo assíncrono de re-sincronização (`syncEngine.ts`, `layoutSync.ts`).
* **SQL Migrations**: Etapas progressivas de banco de dados (`supabase_etapa1_cenas.sql` até `supabase_etapa10_ligacao.sql`).

### **Serviços de IA & Mídia Externa**
* **IA Generativa**: `@google/generative-ai` (Gemini API).
* **Integrações de Mídia**: Scraping/Importação de pins do Pinterest, OpenGraph / Link Preview engine, banco de imagens acoplado.

---

## ⚙️ 3. Funcionalidades Principais

### 🎨 **Canvas Livre & Moodboard (`MoodboardScreen.tsx`, `freeLayout.ts`)**
- Posicionamento em grade infinita/livre com detecção de colisões e snapping.
- Modéis de cartões personalizáveis com cores, fontes, tags e bordas.
- Extração de paleta de cores a partir de imagens importadas (`PaletteExtractor.tsx`).

### 🎬 **Roteirização Audiovisual & Cenas (`SceneCardsView.tsx`, `sceneScriptPdf.ts`)**
- Organização do fluxo de filmagem por cenas, planos e sequências.
- Gerenciamento de status de produção, cronograma e campos personalizados (`SceneFields.tsx`).
- Compilação e exportação de roteiros profissionais formatados em PDF.

### 🎙️ **Gravação de Áudio & Widget Android Nativo (`ideias-widget`)**
- Gravação instantânea de notas de voz através do widget Android na Home Screen.
- Gerenciamento de gravação via serviço Android nativo (`RecordingService.kt`) em segundo plano.
- Sincronização automática entre as mídias salvas no widget e o app principal (`WidgetStore.kt`).

### 🤖 **Assistente Inteligente Gemini (`gemini.ts`, `AskAiDialog.tsx`)**
- **Transformação de Texto em Cenas**: Criação automática de tabelas de cenas a partir de descrições brutas.
- **Reestruturação Criativa**: Síntese de ideias soltas em tópicos organizados.
- **Brainstorming Guiado**: Diálogo interativo para refinamento de conceitos.

### 🔄 **Sincronização Híbrida / Offline-First (`syncEngine.ts`, `sync.ts`)**
- Persistência e edição offline contínua em SQLite local.
- Fila de prioridades de sincronização (`queue.ts`) que envia as atualizações para o Supabase assim que houver conexão.

---

## 📋 4. Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
* **Node.js**: `v18.x` ou superior.
* **Package Manager**: `npm` ou `yarn`.
* **Expo CLI**: Instalação global ou via `npx expo`.
* **Android Studio & SDK** (Obrigatório para testar o Módulo Nativo do Widget Kotlin no emulador/dispositivo).
* **Conta no Supabase** e um projeto configurado.
* **Chave de API do Google Gemini** (Google AI Studio).

### 🔑 **Variáveis de Ambiente (`.env`)**

Crie um arquivo `.env` na raiz do projeto com o seguinte formato:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
EXPO_PUBLIC_GEMINI_API_KEY=sua-chave-api-gemini
```

---

## 🚀 5. Instalação e Execução

### **1. Clonar o Repositório**
```bash
git clone https://github.com/seu-usuario/ideias-app.git
cd ideias-app
```

### **2. Instalar as Dependências**
```bash
npm install
```

### **3. Configurar o Banco de Dados (Supabase)**
Execute os scripts SQL contidos na raiz do projeto dentro do **SQL Editor** do seu painel do Supabase, na seguinte ordem:
1. `supabase_etapa1_cenas.sql`
2. `supabase_etapa6_roteiro.sql`
3. `supabase_etapa7_status.sql`
4. `supabase_etapa8_ordem.sql`
5. `supabase_etapa9_campos.sql`
6. `supabase_etapa10_ligacao.sql`

### **4. Executar o Projeto (Android)**
Devido ao módulo nativo Android Kotlin (`modules/ideias-widget`), é necessário rodar via **Expo Prebuild/Run**:

```bash
# Para gerar a pasta /android e compilar o app nativo
npx expo run:android
```

---

## 💡 6. Guia de Uso / Exemplos

### **Exemplo 1: Gerar Cenas a partir de um Roteiro Bruto usando IA**
1. Abra uma nota no aplicativo ou acesse a aba de Roteiros.
2. Clique no ícone da **IA (Gemini)**.
3. Escolha a opção **"Gerar Cenas a partir de Texto"**.
4. Insira um texto corrido (Ex: *"Cena 1: Pedro entra no café chuvoso. Ele observa Maria no fundo lendo um livro..."*).
5. A IA processará o texto e preencherá automaticamente os campos de Cenas, Ação, Personagens e Planos.

### **Exemplo 2: Exportar Roteiro em PDF**
1. No menu da coleção ou moodboard audiovisual, selecione o menu de ações.
2. Clique em **"Exportar Roteiro PDF"**.
3. O serviço `sceneScriptPdf.ts` compilará o layout técnico de roteiro e abrirá a caixa de compartilhamento do sistema.

### **Exemplo 3: Gravação Rápida pelo Widget Android**
1. Adicione o widget do **Ideias** na tela inicial do seu celular Android.
2. Toque no botão vermelho de microfone do widget.
3. Fale a sua ideia; ao encerrar, o áudio será armazenado e sincronizado na biblioteca do aplicativo.

---

## 📁 7. Estrutura de Pastas

```text
ideias-app/
├── assets/                     # Ícones, fontes e recursos visuais estáticos
├── modules/                    # Módulos nativos customizados do Expo
│   └── ideias-widget/          # Módulo Android Kotlin (Widget Home Screen & Gravador)
│       ├── android/            # Código Java/Kotlin, layouts XML e manifest nativo
│       └── index.ts            # Bridge TypeScript do módulo nativo
├── src/                        # Código-fonte principal em React Native / TypeScript
│   ├── AgendaScreen.tsx        # Tela de calendário e organização de prazos
│   ├── LibraryScreen.tsx       # Gestão da biblioteca de notas, ideias e coleções
│   ├── MoodboardScreen.tsx     # Canvas interativo com suporte a drag-and-drop
│   ├── NoteScreen.tsx          # Editor avançado de nota / cartão
│   ├── AskAiDialog.tsx         # Interface para interação com a IA Gemini
│   ├── gemini.ts               # Integração e prompts com a API Google Gemini
│   ├── supabase.ts             # Cliente de integração com Supabase
│   ├── syncEngine.ts           # Mecanismo offline-first e sincronização de dados
│   ├── db.ts                   # Banco de dados local/SQLite
│   ├── exportPdf.ts            # Utilitário para compilação e geração de arquivos PDF
│   └── freeLayout.ts           # Lógica matemática e espacial do Canvas
├── supabase_etapa*.sql         # Migrações SQL ordenadas para o banco Supabase
├── App.tsx                     # Componente principal / Inicialização do app
├── app.json                    # Configuração do Expo Client e Plugins
├── package.json                # Dependências e scripts do projeto
└── tsconfig.json               # Configurações do compilador TypeScript
```

---

📌 *Documentação gerada automaticamente seguindo os padrões de Engenharia de Software e Documentação Técnica.*
