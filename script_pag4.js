(function() {
    // --- Elementos DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('startMenuOverlay');
    const messageDiv = document.getElementById('messageArea');
    const reiniciarBtn = document.getElementById('reiniciarBtn');
    const abrirMenuBtn = document.getElementById('abrirMenuBtn');
    
    // Dimensões fixas internas (800x400)
    const CANVAS_W = 800;
    const CANVAS_H = 400;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // --- Estado do Jogo ---
    let gameActive = false;      // jogo rodando (após iniciar e não game over)
    let gameOver = false;
    let victory = false;
    let currentMessage = null;
    
    // Personagem (posição x fixa na faixa, mas controlamos o "progresso" horizontalmente? vamos usar eixo Y: calçada inferior → calçada superior)
    // Personagem começa na base (y = 340), destino y = 60 (calçada de cima)
    let playerY = 340;          // coordenada y do centro do boneco
    let targetReached = false;
    
    // Semáforo: "green" ou "red"
    let trafficLight = "red";   // começa vermelho
    let lightTimer = 0;
    let lightInterval = 3000;   // 3 segundos alternância (didático)
    
    // Controle para evitar múltiplas vitórias/derrotas
    let gameLock = false;
    
    // Áudio: Web Audio API ou Audio elements (estrutura comentada)
    let bgMusic = null;
    let winSound = null;
    let loseSound = null;
    let lightChangeSound = null;
    let clapSound = null;
    let currentVolume = 0.6;
    
    // Inicializar sons com paths genéricos (comentários para substituir)
    function initAudio() {
      try {
        bgMusic = new Audio('sons/trilha_fundo.mp3');   // Substitua pelo caminho real
        bgMusic.loop = true;
        winSound = new Audio('sons/vitoria.mp3');
        loseSound = new Audio('sons/derrota.mp3');
        lightChangeSound = new Audio('sons/semaforo.mp3');
        clapSound = new Audio('sons/palmas.mp3');
        
        // Prevenir erros caso arquivos não existam (silencia erro e avisa console)
        const soundFiles = [bgMusic, winSound, loseSound, lightChangeSound, clapSound];
        soundFiles.forEach(snd => {
          if(snd) snd.onerror = () => console.warn("Áudio não encontrado: ", snd.src);
        });
        setVolume(currentVolume);
      } catch(e) { console.warn("Áudio não suportado ou erro:", e); }
    }
    
    function setVolume(vol) {
      currentVolume = Math.min(1, Math.max(0, vol));
      [bgMusic, winSound, loseSound, lightChangeSound, clapSound].forEach(snd => {
        if(snd) snd.volume = currentVolume;
      });
    }
    
    function playSound(soundObj) {
      if(soundObj && currentVolume > 0) {
        soundObj.currentTime = 0;
        soundObj.play().catch(e => console.log("playback error", e));
      }
    }
    
    function stopBgMusic() {
      if(bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    }
    
    function startBgMusic() {
      if(bgMusic && currentVolume > 0 && gameActive && !gameOver && !victory) {
        bgMusic.play().catch(e => console.log("autoplay bloqueado? interação do usuário"));
      }
    }
    
    // --- Lógica do Semáforo (ciclo automático) ---
    function updateTrafficLight(deltaTime) {
      if(!gameActive || gameOver || victory) return;
      lightTimer += deltaTime;
      if(lightTimer >= lightInterval) {
        lightTimer = 0;
        trafficLight = (trafficLight === "red") ? "green" : "red";
        playSound(lightChangeSound);
      }
    }
    
    // --- Movimento (clicar no canvas) ---
    function tryMove() {
      if(!gameActive || gameOver || victory || gameLock) return false;
      // Só pode mover (atravessar) se estiver na calçada inferior (y ~340) e sinal verde
      // Personagem só anda se ainda não venceu e está na posição inicial
      if(playerY >= 330 && trafficLight === "green") {
        // Avança até o topo (vitória)
        playerY = 60;
        victory = true;
        gameActive = false;
        gameLock = true;
        stopBgMusic();
        playSound(winSound);
        messageDiv.style.display = "block";
        messageDiv.innerHTML = "🎉 PARABÉNS! Você atravessou com segurança! 🎉<br><button id='btnReiniciarPosVitoria' class='btn-jogo'>Jogar novamente</button>";
        document.getElementById('btnReiniciarPosVitoria')?.addEventListener('click', () => resetGame());
        draw(); // redesenha vitória
        return true;
      } 
      else if(playerY >= 330 && trafficLight === "red") {
        // Derrota: atravessou no vermelho
        gameActive = false;
        gameOver = true;
        gameLock = true;
        stopBgMusic();
        playSound(loseSound);
        messageDiv.style.display = "block";
        messageDiv.innerHTML = "❌ Você atravessou na hora errada e não esperou o sinal abrir! Tente novamente. ❌<br><button id='btnReiniciarDerrota' class='btn-jogo'>Reiniciar</button>";
        document.getElementById('btnReiniciarDerrota')?.addEventListener('click', () => resetGame());
        draw();
        return false;
      } 
      else {
        // Aviso se clicar e não estiver na posição ou já venceu
        if(gameActive && playerY < 330) {
          messageDiv.style.display = "block";
          messageDiv.innerHTML = "⚠️ Você já está do outro lado! Clique em Reiniciar para nova partida.";
          setTimeout(() => { if(messageDiv && !gameActive) {} }, 2000);
        }
        return false;
      }
      return false;
    }
    
    // Reinício completo do estado
    function resetGame() {
      gameActive = true;
      gameOver = false;
      victory = false;
      gameLock = false;
      playerY = 340;
      trafficLight = "red";
      lightTimer = 0;
      messageDiv.style.display = "none";
      messageDiv.innerHTML = "";
      stopBgMusic();
      startBgMusic();
      draw();
    }
    
    // --- Desenho do jogo (Rua, Faixa, Semáforo, Personagem)---
    function draw() {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      // Calçadas e asfalto
      ctx.fillStyle = "#C0A080";
      ctx.fillRect(0, 0, CANVAS_W, 60);  // calçada superior
      ctx.fillRect(0, CANVAS_H-60, CANVAS_W, 60); // calçada inferior
      ctx.fillStyle = "#404040";
      ctx.fillRect(0, 60, CANVAS_W, CANVAS_H-120);
      // Faixa de pedestres (listras brancas)
      ctx.fillStyle = "white";
      for(let i = 0; i < 8; i++) {
        ctx.fillRect(100 + i*75, 170, 40, 60);
      }
      // Semáforo
      ctx.fillStyle = "#2C2C2C";
      ctx.fillRect(680, 80, 40, 90);
      // Luzes
      ctx.beginPath();
      ctx.arc(700, 110, 12, 0, 2*Math.PI);
      ctx.fillStyle = (trafficLight === "red") ? "#FF4444" : "#882222";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(700, 150, 12, 0, 2*Math.PI);
      ctx.fillStyle = (trafficLight === "green") ? "#44FF44" : "#226622";
      ctx.fill();
      
      // Personagem (boneco simples)
      ctx.fillStyle = "#FFB347";
      ctx.beginPath();
      ctx.arc(400, playerY, 16, 0, 2*Math.PI);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(390, playerY-4, 3, 0, 2*Math.PI);
      ctx.arc(410, playerY-4, 3, 0, 2*Math.PI);
      ctx.fill();
      ctx.fillStyle = "#D2691E";
      ctx.fillRect(395, playerY+5, 10, 12);
      
      // texto instrução
      ctx.font = "bold 14px 'Segoe UI'";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowBlur = 0;
      ctx.fillText("Clique para andar", 20, 50);
      if(trafficLight === "green") ctx.fillStyle = "#C8FFC8";
      else ctx.fillStyle = "#FFC8C8";
      ctx.fillText(`Sinal: ${trafficLight === "green" ? "VERDE ✓" : "VERMELHO ✗"}`, 680, 50);
      
      if(victory) {
        ctx.font = "bold 28px 'Segoe UI'";
        ctx.fillStyle = "#FFD966";
        ctx.shadowColor = "black";
        ctx.fillText("VITÓRIA!", CANVAS_W/2-70, 80);
      } else if(gameOver) {
        ctx.font = "bold 24px 'Segoe UI'";
        ctx.fillStyle = "#FFAAAA";
        ctx.fillText("ATROPELADO!", CANVAS_W/2-80, 120);
      }
    }
    
    // Loop de animação (atualiza semáforo)
    let lastTimestamp = 0;
    function gameLoop(now) {
      requestAnimationFrame(gameLoop);
      if(!lastTimestamp) { lastTimestamp = now; return; }
      let delta = Math.min(100, now - lastTimestamp);
      if(delta > 0 && gameActive && !gameOver && !victory) {
        updateTrafficLight(delta);
        draw();
      } else {
        draw();
      }
      lastTimestamp = now;
    }
    
    // --- Eventos ---
    canvas.addEventListener('click', (e) => {
      e.preventDefault();
      if(gameActive && !gameOver && !victory) {
        tryMove();
        draw();
      } else if(!gameActive && !overlay.style.visibility) {
        // se não ativo e sem overlay, exibir msg
        if(!gameActive && !victory && !gameOver) {
          messageDiv.style.display = "block";
          messageDiv.innerHTML = "⚠️ O jogo não está ativo. Clique em 'Menu Principal' e inicie uma partida.";
        }
      }
    });
    
    function closeOverlayAndResetGame() {
      overlay.style.display = "none";
      resetGame();
    }
    
    // Menu overlay: Iniciar
    document.getElementById('btnIniciar').addEventListener('click', () => {
      overlay.style.display = "none";
      resetGame();
      if(bgMusic) { stopBgMusic(); startBgMusic(); }
    });
    
    // Configurações (slider)
    const configBtn = document.getElementById('btnConfig');
    const configPanel = document.getElementById('configPanel');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const fecharConfig = document.getElementById('fecharConfig');
    
    configBtn.addEventListener('click', () => {
      configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
    });
    fecharConfig.addEventListener('click', () => { configPanel.style.display = 'none'; });
    volumeSlider.addEventListener('input', (e) => {
      let val = parseFloat(e.target.value);
      volumeValue.innerText = Math.round(val*100)+"%";
      setVolume(val);
      if(bgMusic) bgMusic.volume = currentVolume;
    });
    
    // Botão Sair (mostra mensagem e palmas)
    document.getElementById('btnSair').addEventListener('click', () => {
      alert("Obrigado por jogar e apoiar nosso projeto!");
      playSound(clapSound);
      // Opcional: fecha o overlay, mas não inicia o jogo
      overlay.style.display = "none";
      gameActive = false;
      stopBgMusic();
      messageDiv.style.display = "block";
      messageDiv.innerHTML = "✨ Obrigado por visitar a demonstração! Feche a mensagem e clique em 'Menu Principal' para jogar novamente. ✨";
    });
    
    reiniciarBtn.addEventListener('click', () => { resetGame(); });
    abrirMenuBtn.addEventListener('click', () => {
      overlay.style.display = "flex";
      gameActive = false;
      stopBgMusic();
    });
    
    // Menu mobile
    const toggleBtn = document.getElementById('menuToggle');
    const menuNav = document.getElementById('menuNav');
    if(toggleBtn && menuNav) {
      toggleBtn.addEventListener('click', () => {
        menuNav.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', menuNav.classList.contains('active'));
      });
    }
    
    // Inicialização
    initAudio();
    resetGame(); // inicia como "não ativo até iniciar via menu" - mas resetGame coloca gameActive=true, então vamos ajustar: resetGame() liga gameActive, porém queremos que o jogo comece só depois do menu. Então:
    // Sobrescrevemos: inicialmente gameActive = false, e o overlay está visível.
    gameActive = false;
    gameOver = false;
    victory = false;
    playerY = 340;
    draw();
    // garantir que ao iniciar pelo menu, tudo funcione.
    const originalReset = resetGame;
    window.resetGame = resetGame;
    // start loop
    requestAnimationFrame(gameLoop);
    // configurar volume inicial
    setVolume(0.6);
    volumeSlider.value = 0.6;
    volumeValue.innerText = "60%";
    if(bgMusic) bgMusic.volume = 0.6;
  })();