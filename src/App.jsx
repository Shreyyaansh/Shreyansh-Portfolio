import { useEffect, useRef, useState } from 'react'
import './portfolio.css'

function App() {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  function replayVideo() {
    if (!videoRef.current) return;
    try { videoRef.current.currentTime = 0; } catch {}
    try { videoRef.current.playbackRate = 1; } catch {}
    const p = videoRef.current.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  useEffect(() => {
    // Show loading animation for 1.2 seconds (matching ball animation)
    const loadingTimer = setTimeout(() => {
      const loader = document.querySelector('.cricket-ball-loader');
      if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
          setIsLoading(false);
        }, 200); // Fade-out duration
      } else {
        setIsLoading(false);
      }
    }, 1200);

    return () => clearTimeout(loadingTimer);
  }, []);

  // Mouse tracking for cursor ball
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // Particles canvas
    const canvas = document.getElementById('stadiumParticles');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let particles = [];
    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    }
    function initParticles() {
      if (!canvas) return;
      const count = Math.floor((innerWidth * innerHeight) / 28000);
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.2,
        a: Math.random() * 0.5 + 0.2,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
      }));
    }
    let rafId;
    function renderParticles() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a * 0.08})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(renderParticles);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initParticles();
    renderParticles();

    // Play hero video on load
    replayVideo();

    

    // Layered background like the reference: body gets a class per section
    const bg2 = document.querySelector('.bg-image-2');
    const aboutSection = document.getElementById('about');
    let sectionObserver;
    let homeObserver;
    let isPlayingOnce = false;
    if (bg2 && aboutSection) {
      sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
            document.body.classList.add('bg-about');
          } else {
            document.body.classList.remove('bg-about');
          }
        });
      }, { threshold: [0, 0.15, 0.6, 1] });
      sectionObserver.observe(aboutSection);
    }

    // Play hero video only when leaving and returning to Home
    let hasLeftHome = false;
    let isCurrentlyInHome = false;
    const homeEl = document.getElementById('home');
    if (homeEl) {
      homeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            // We're entering home section
            if (!isCurrentlyInHome) {
              isCurrentlyInHome = true;
              // Replay if we've left home and come back, or it's the first time
              if (hasLeftHome || !isPlayingOnce) {
                replayVideo();
                isPlayingOnce = true;
              }
            }
          } else if (!entry.isIntersecting) {
            // We've completely left the home section
            isCurrentlyInHome = false;
            hasLeftHome = true;
          }
        });
      }, { threshold: [0, 0.6, 1] });
      homeObserver.observe(homeEl);
    }

    // Track ended to freeze at the last frame and mark as not playing
    

    // Clicking any Home link should replay once
    const homeLinks = Array.from(document.querySelectorAll('a[href="#home"]'));
    function handleHomeClick() { replayVideo(); }
    homeLinks.forEach((el) => el.addEventListener('click', handleHomeClick));

    // Slider functionality
    const sliderTabs = document.querySelectorAll('.slider__tab');
    const sliderPanels = document.querySelectorAll('.slider__panel');
    
    function handleTabClick(e) {
      const targetTab = e.target.dataset.tab;
      const targetPanel = document.getElementById(`${targetTab}-panel`);
      
      // Check if the clicked tab is already active
      if (e.target.classList.contains('active')) {
        // If it's active, toggle it off (collapse)
        e.target.classList.remove('active');
        targetPanel.classList.remove('active');
      } else {
        // If it's not active, remove active from all and activate this one
        sliderTabs.forEach(tab => tab.classList.remove('active'));
        sliderPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        e.target.classList.add('active');
        targetPanel.classList.add('active');
      }
    }
    
    sliderTabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (rafId) cancelAnimationFrame(rafId);
      if (sectionObserver && aboutSection) sectionObserver.unobserve(aboutSection);
      if (homeObserver && homeEl) homeObserver.unobserve(homeEl);
      
      homeLinks.forEach((el) => el.removeEventListener('click', handleHomeClick));
      sliderTabs.forEach(tab => {
        tab.removeEventListener('click', handleTabClick);
      });
    };
  }, []);

  return (
    <>
      {/* Cricket Ball Loading Animation */}
      {isLoading && (
        <div className="cricket-ball-loader">
          <img 
            src="/cricket.png" 
            alt="Cricket Ball" 
            className="cricket-ball-image"
          />
        </div>
      )}

      {/* Cursor Cricket Ball */}
      {!isLoading && (
        <div 
          className="cursor-ball"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        >
          <img 
            src="/cricket.png" 
            alt="Cursor Cricket Ball" 
            className="cursor-ball-image"
          />
        </div>
      )}
      
      <div className="bg-image" aria-hidden="true"></div>
      <div className="bg-image-2" aria-hidden="true"></div>
      <canvas id="stadiumParticles" aria-hidden="true"></canvas>
      <header className="hero" id="home" role="banner">
        <div className="hero__content">
          <div className="home-stack">
            {/* Top two pills as in the sketch */}
            <div className="pill pill--name">
              <span className="pill__left">SHREYANSH SHARMA</span>
              <span className="pill__right">AGE:21</span>
            </div>
            <div className="pill pill--role">
              <span className="pill__left">CS ENGINEER</span>
              <span className="pill__right">10101</span>
            </div>

            {/* Big glass panel with curved-left nav and avatar on right */}
            <section className="glass-panel" aria-label="Navigation panel">
              <div className="panel-inner">
                <div className="nav-curved">
                  <ul className="nav-list">
                    <li><a className="nav-pill" href="#home" data-hover="Home">Stadium</a></li>
                    <li><a className="nav-pill" href="#about" data-hover="About Me">Player Profile</a></li>
                    <li><a className="nav-pill" href="#projects" data-hover="Projects">Match Highlights</a></li>
                    <li><a className="nav-pill" href="#contact" data-hover="Contact">Commentary Box</a></li>
                  </ul>
                </div>
                <div className="panel-right">
                  {/* Avatar anchored bottom-right, slight overlap */}
                  <video
                    ref={videoRef}
                    className="avatar"
                    src="/hello.webm"
                    muted
                    playsInline
                    alt="Shreyansh avatar"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </header>

      <main>
        <section id="about" className="section">
          <div className="container about">
            <h2 className="section__title section__title--accent reveal">About me</h2>
            <p className="about__lead reveal">Hi I am <span className="accent-text">Shreyansh</span>, a Computer Science undergraduate specializing in <span className="accent-text">AI/ML</span> and <span className="accent-text">Full-Stack Development</span>. I love <span className="accent-text">problem solving</span> and <span className="accent-text">creative work</span>, which drives me to build innovative solutions and user-friendly applications. Skilled in developing predictive models and scalable web applications, with hands-on experience in applying data-driven solutions to real-world challenges.</p>
            
            <div className="about__slider reveal">
              <div className="slider__tabs">
                <button className="slider__tab" data-tab="skills" data-hover="Skills">Batting Style</button>
                <button className="slider__tab" data-tab="education" data-hover="Education">Training</button>
                <button className="slider__tab" data-tab="experience" data-hover="Experience">Career Stats</button>
              </div>
              
              <div className="slider__content">
                <div className="slider__panel" id="skills-panel">
                  <div className="skills__container">
                    <div className="skills__category">
                      <h4 className="skills__category-title">Programming Languages</h4>
                      <ul className="about__chips">
                        <li className="skill-chip skill-chip--primary">Python</li>
                        <li className="skill-chip skill-chip--primary">C/C++</li>
                        <li className="skill-chip skill-chip--primary">JavaScript</li>
                        <li className="skill-chip skill-chip--primary">SQL</li>
                      </ul>
                    </div>
                    
                    <div className="skills__category">
                      <h4 className="skills__category-title">Web Development</h4>
                      <ul className="about__chips">
                        <li className="skill-chip skill-chip--secondary">HTML</li>
                        <li className="skill-chip skill-chip--secondary">CSS</li>
                        <li className="skill-chip skill-chip--secondary">React.js</li>
                        <li className="skill-chip skill-chip--secondary">Node.js</li>
                        <li className="skill-chip skill-chip--secondary">Express</li>
                        <li className="skill-chip skill-chip--secondary">MongoDB</li>
                      </ul>
                    </div>
                    
                    <div className="skills__category">
                      <h4 className="skills__category-title">AI & Tools</h4>
                      <ul className="about__chips">
                        <li className="skill-chip skill-chip--accent">Machine Learning</li>
                        <li className="skill-chip skill-chip--accent">Deep Learning</li>
                        <li className="skill-chip skill-chip--accent">NLP</li>
                        <li className="skill-chip skill-chip--accent">DSA</li>
                        <li className="skill-chip skill-chip--accent">Git</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="slider__panel" id="education-panel">
                  <div className="education__timeline">
                    <div className="education__item education__item--current">
                      <div className="education__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                      </div>
                      <div className="education__content">
                        <div className="education__period">2022 - 2026</div>
                        <h3 className="education__institution">Manipal University Jaipur</h3>
                        <p className="education__degree">B.Tech (HONS) in Computer Science Engineering</p>
                        <p className="education__specialization">Specialization: Artificial Intelligence & Machine Learning</p>
                        <div className="education__status">Currently Pursuing</div>
                      </div>
                    </div>
                    
                    <div className="education__item">
                      <div className="education__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                      <div className="education__content">
                        <div className="education__period">2021 - 2022</div>
                        <h3 className="education__institution">Global Indian International School</h3>
                        <p className="education__degree">Higher Secondary Education</p>
                        <p className="education__specialization">Stream: Physics, Chemistry, Mathematics (PCM)</p>
                        <div className="education__status">Completed</div>
                      </div>
                    </div>
                    
                    <div className="education__item">
                      <div className="education__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                      <div className="education__content">
                        <div className="education__period">2019 - 2020</div>
                        <h3 className="education__institution">Global Indian International School</h3>
                        <p className="education__degree">Secondary Education</p>
                        <p className="education__specialization">Class 10 - CBSE Board</p>
                        <div className="education__status">Completed</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="slider__panel" id="experience-panel">
                  <div className="experience__container">
                    <div className="match-delayed">
                      <div className="rain-icon">🌧️</div>
                      <h3 className="match-delayed__title">Match Delayed Due to Rain</h3>
                      <p className="match-delayed__message">Experience section is currently under construction. Check back later for career highlights!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="section">
          <div className="container">
            <h2 className="section__title">Projects</h2>
            <div className="projects__grid">
              <article className="project-card">
                <h3>Chitralaya – Artist Marketplace</h3>
                <p>Marketplace for showcasing and selling artwork with uploads, browsing, and secure orders.</p>
                <div className="project-card__meta">Node.js · MongoDB · HTML/CSS/JS</div>
                <div className="project-card__actions">
                  <a className="project-btn" href="https://chitralaya.vercel.app/" target="_blank" rel="noopener noreferrer">View Project</a>
                </div>
              </article>

              <article className="project-card">
                <h3>Café Culture – MERN Stack</h3>
                <p>Full-stack Café Culture website with customer & admin portals, dashboards, cart/checkout, table-based ordering, and MongoDB Atlas.</p>
                <div className="project-card__meta">MongoDB · Express · React · Node</div>
                <div className="project-card__actions">
                  <a className="project-btn" href="https://cafe-culture.vercel.app/" target="_blank" rel="noopener noreferrer">View Project</a>
                </div>
              </article>

              <article className="project-card">
                <h3>Diabetes Prediction (ML)</h3>
                <p>Supervised model to predict risk with an interactive Streamlit app and clear metrics.</p>
                <div className="project-card__meta">Python · Pandas · scikit‑learn · Streamlit</div>
                <div className="project-card__actions">
                  <a className="project-btn" href="#">View Project</a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <h2 className="section__title">Contact</h2>
            <ul className="contact-icons">
              <li>
                <a className="icon-btn" href="https://drive.google.com/file/d/1QEgbp6sRL4sH_EY3FVusA1QFCtiRGLkL/view?usp=sharing" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>
                  <span>Resume</span>
                </a>
              </li>
              <li>
                <a className="icon-btn" href="mailto:shrey250804@gmail.com">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5Z"/></svg>
                  <span>Email</span>
                </a>
              </li>
              <li>
                <a className="icon-btn" href="https://github.com/Shreyyaansh" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.5 2 2 6.6 2 12.3c0 4.6 3 8.5 7.2 9.9.5.1.7-.2.7-.5v-1.9c-3 .7-3.7-1.3-3.7-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 2 .7 2 1 .2 2-.6 2-.6-.9-.1-1.8-.5-2.4-1.2a3.8 3.8 0 0 1-.9-2.6c0-1 .3-1.8.9-2.5-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.7 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7.9 1.6.9 2.5 0 1-.3 1.9-.9 2.6-.6.7-1.5 1.1-2.4 1.2 0 0 1 .8 2.1.6v2.4c0 .3.2.6.7.5 4.2-1.4 7.2-5.3 7.2-9.9C22 6.6 17.5 2 12 2Z"/></svg>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a className="icon-btn" href="https://linkedin.com/in/shreyyaansh" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5C4.98 4.9 3.9 6 2.5 6S0 4.9 0 3.5 1.1 1 2.5 1s2.48 1.1 2.48 2.5zM.5 8h4V23h-4zM8 8h3.8v2.1h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.7 2.6 4.7 6v8.9h-4V15.7c0-1.6 0-3.7-2.3-3.7s-2.7 1.8-2.7 3.6V23h-4V8z"/></svg>
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a className="icon-btn" href="https://instagram.com/shreyyaansh_" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5Zm5.8-3.6a1.2 1.2 0 1 1-1.2-1.2 1.2 1.2 0 0 1 1.2 1.2Z"/></svg>
                  <span>Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© <span>{new Date().getFullYear()}</span> Shreyansh.Built with passion and precision.</p>
        </div>
      </footer>
    </>
  )
}

export default App
