import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"

import heroImage from "../../assets/hero-woman.png";
import meditationImage from "../../assets/meditation-woman.png";

function Home() {
    return(
        <div className="home-page">
            <section className="hero-section">
                <div className="hero-shape hero-shape-top"></div>
                <div className="hero-shape hero-shape-left"></div>
                <div className="hero-shape hero-shape-middle"></div>

                <div className="hero-content">
                    <div className="hero-text">
                        <h1>
                            You're Not Alone,
                            <br />
                            Your <span>Healing</span> Starts Here.
                        </h1>
                        <p>Safe, anonymour mental health support for Youth.</p>
                        
                        <div className="hero-buttons">
                            <Link to="/register" className="home-btn">
                             Get Started
                            </Link>

                            <Link to="/guest-ai" className="home-btn">
                             Try Support Assistant
                            </Link>
                        </div>
                    </div>

                    <div className="hero-image-wrap">
                        <img src={heroImage} alt="Woman writing in notebook" className="hero-image" />
                    </div>
                </div>
            </section>

            <section className="why-section">
                <h2>
                    Why <span>SereniLink</span>?
                </h2>

                <div className="why-cards">
                    <div className="info-card">
                        <div className="card-icon">AI</div>
                        <h3>AI Support</h3>
                        <p>
                            Our AI assistant helps you express how you feel, understand your
                            emotions, and receive personalized coping guidance in real time.
                        </p>
                    </div>
                    
                    <div className="info-card">
                        <div className="card-icon">⚕</div>
                        <h3>Professional Support Access</h3>
                        <p>
                            Connect privately with licensed mental health professionals through
                            secure conversations designed for comfort and confidentiality.
                        </p>
                    </div>

                    <div className="info-card">
                       <div className="card-icon">🧘</div>
                       <h3>Personalized Wellness Tools</h3>
                       <p>
                            Access guided breathing exercises, journaling prompts, and
                            stress-management techniques tailored to your emotional state and
                            personal needs.
                       </p>
                    </div>
                </div>
            </section>

            <section className="resources-section">
                <div clasName="resources-left">
                    <h2>Explore
                        <br />
                        <span>Resources</span>
                    </h2>

                    <p className="resources-subtitle">
                        Some of the mental health resources
                    </p>

                    <div className="resource-list">
                        <div className="resource-card">
                            <div className="resource-icon">📖</div>
                            <div>
                                <h3>Understanding Stress: A youth guide</h3>
                                <p>
                                    Learn what stress is, how it affects your body and mind, and
                                    simple ways to manage it in your daily...
                                </p>
                            </div>
                        </div>

                        <div className="resource-card">
                            <div className="resource-icon">🎥</div>
                            <div>
                                <h3>Guided Meditation for Anxiety</h3>
                                <p>
                                    A gentle guided meditation designed to help ease anxious
                                    thoughts and feelings...
                                </p>
                            </div>
                        </div>

                        <div className="resource-card">
                            <div className="resource-icon">📖</div>
                            <div>
                                <h3>Building Healthy Sleep Habits</h3>
                                <p>
                                    Sleep is crucial for mental health. Learn how to create a
                                    bedtime routine that works for you...
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link to="/resources" className="home-btn view-btn">
                        View more Resources
                    </Link>
                </div>

                <div className="resources-right">
                    <img src={meditationImage} alt="Meditation session" className="resources-image" />
                </div>
            </section>

            <section className="works-section">
                <h2>
                    How <span>Serenilink</span> Works
                </h2>

                <div className="steps">
                    <div className="step-box">
                        <div className="step-number">1</div>
                        <p>Browse Educational Contents and try some of the calming tools.</p>
                    </div>

                    <div className="step-box">
                        <div className="step-number">2</div>
                        <p>Create an anonymous account to save progress and book appointments.</p>
                    </div>

                    <div className="step-box">
                        <div className="step-number">3</div>
                        <p>Use AI assistance, take assessments and connect with counselors.</p>
                    </div>
                </div>
            </section>

            <section className="tools-section">
                <h2>
                    Quick <span>Calm</span> Tools
                </h2>

                <div className="rings"></div>

                <div className="tools-grid">
                    <div className="tool-card">
                        <div className="tool-icon">〰</div>
                        <h3>Breathing Bubble</h3>
                        <p>Follow the animated bubble to calm your breathing</p>
                    </div>

                    <div className="tool-card">
                        <div className="tool-icon">◉</div>
                        <h3>5-4-3-2-1 Grounding</h3>
                        <p>Ground yourself in the present moment.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;