import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RiRobot2Line } from "react-icons/ri";
import { GiStethoscope } from "react-icons/gi";
import { MdSelfImprovement } from "react-icons/md";
import { Wind, Eye } from "lucide-react";
import "./Home.css";
import api from "../../api/axios";

import heroImage from "../../assets/hero-woman.png";
import meditationImage from "../../assets/meditation-woman.png";

const openChat = () => window.dispatchEvent(new Event("open-guest-chat"));

const CATEGORY_ICONS = {
  video: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="resource-svg">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M3 15.75v-7.5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m17.168-8.759l-4 3.563a.5.5 0 0 0-.168.373v1.778a.5.5 0 0 0 .168.373l4 3.563a.5.5 0 0 0 .832-.374V7.365a.5.5 0 0 0-.832-.374" />
    </svg>
  ),
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="resource-svg">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M16 7S9 1 2 6v22c7-5 14 0 14 0s7-5 14 0V6c-7-5-14 1-14 1m0 0v21" />
    </svg>
  ),
};

function Home() {
  const [previewContent, setPreviewContent] = useState([]);

  useEffect(() => {
    api.get("/content/", { params: { limit: 3 } })
      .then((res) => setPreviewContent(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-shape hero-shape-left"></div>
        <div className="hero-shape hero-shape-top"></div>
        <div className="hero-shape hero-shape-middle"></div>
        <div className="hero-shape hero-shape-bottom"></div>

        <div className="hero-content">
          <div className="hero-text">
            <h1>
              You're Not Alone,
              <br />
              Your <span>Healing</span> Starts Here.
            </h1>
            <p>Safe, anonymous mental health support for Youth.</p>
            <div className="hero-buttons">
              <Link to="/register" className="home-btn">Get Started</Link>
              <button type="button" className="home-btn" onClick={openChat}>
                Try Support Assistant
              </button>
            </div>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img src={heroImage} alt="Woman writing in notebook" className="hero-image" />
        </div>
      </section>

      <section className="why-section">
        <h2>Why <span>SereniLink</span>?</h2>
        <div className="why-cards">
          <div className="info-card">
            <div className="card-icon">
              <RiRobot2Line className="feature-svg" />
            </div>
            <h3>AI Support</h3>
            <p>Our AI assistant helps you express how you feel, understand your emotions, and receive personalized coping guidance in real time.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">
              <GiStethoscope className="feature-svg" />
            </div>
            <h3>Professional Support Access</h3>
            <p>Connect privately with licensed mental health professionals through secure conversations designed for comfort and confidentiality.</p>
          </div>
          <div className="info-card">
            <div className="card-icon">
              <MdSelfImprovement className="feature-svg" />
            </div>
            <h3>Personalized Wellness Tools</h3>
            <p>Access guided breathing exercises, journaling prompts, and stress-management techniques tailored to your emotional state and personal needs.</p>
          </div>
        </div>
      </section>

      <section className="resources-section">
        <div className="resources-left">
          <h2>Explore<br /><span>Resources</span></h2>
          <p className="resources-subtitle">Some of the mental health resources</p>
          <div className="resource-list">
            {previewContent.length > 0
              ? previewContent.map((item) => (
                  <div className="resource-card" key={item.id}>
                    <div className="resource-icon">
                      {CATEGORY_ICONS[(item.category || "").toLowerCase()] || CATEGORY_ICONS.default}
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.summary ? item.summary.slice(0, 90) + "..." : item.body.slice(0, 90) + "..."}</p>
                    </div>
                  </div>
                ))
              : [
                  { id: 1, title: "Understanding Stress: A youth guide", summary: "Learn what stress is, how it affects your body and mind, and simple ways to manage it in your daily..." },
                  { id: 2, title: "Guided Meditation for Anxiety", summary: "A gentle guided meditation designed to help ease anxious thoughts and feelings..." },
                  { id: 3, title: "Building Healthy Sleep Habits", summary: "Sleep is crucial for mental health. Learn how to create a bedtime routine that works for you..." },
                ].map((item) => (
                  <div className="resource-card" key={item.id}>
                    <div className="resource-icon">{CATEGORY_ICONS.default}</div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </div>
                  </div>
                ))
            }
          </div>
          <Link to="/resources" className="home-btn view-btn">View more Resources</Link>
        </div>
        <div className="resources-right">
          <img src={meditationImage} alt="Meditation session" className="resources-image" />
        </div>
      </section>

      <section className="works-section">
        <h2>How <span>Serenilink</span> Works</h2>
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
        <h2>Quick <span>Calm</span> Tools</h2>
        <div className="rings"></div>
        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon">
              <Wind className="tool-svg" />
            </div>
            <h3>Breathing Bubble</h3>
            <p>Follow the animated bubble to calm your breathing</p>
          </div>
          <div className="tool-card">
            <div className="tool-icon">
              <Eye className="tool-svg" />
            </div>
            <h3>5-4-3-2-1 Grounding</h3>
            <p>Ground yourself in the present moment.</p>
          </div>
        </div>
      </section>

      {/* Floating icon button */}
      <button type="button" className="home-chat-btn" title="Chat with SereniLink AI" onClick={openChat}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-svg">
          <path fill="currentColor" d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z" />
        </svg>
      </button>
    </div>
  );
}

export default Home;
