import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"

import heroImage from "../../assets/hero-woman.png";
import meditationImage from "../../assets/meditation-woman.png";

function Home() {
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
                <Link to="/register" className="home-btn">
                  Get Started
                </Link>

                <Link to="/guest-ai" className="home-btn">
                  Try Support Assistant
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-image-wrap">
            <img
              src={heroImage}
              alt="Woman writing in notebook"
              className="hero-image"
            />
          </div>
        </section>

        <section className="why-section">
          <h2>
            Why <span>SereniLink</span>?
          </h2>

          <div className="why-cards">
            <div className="info-card">
              <div className="card-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="feature-svg"
                >
                  <path
                    fill="currentColor"
                    d="M12 2a2 2 0 0 1 1 3.73V6h3a4 4 0 0 1 4 4v.05a2.501 2.501 0 0 1 0 4.9V16a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1.05a2.5 2.5 0 0 1 0-4.9V10a4 4 0 0 1 4-4h3v-.27A2 2 0 0 1 12 2m-3 9a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1m6 0a1 1 0 0 0-1 1v2a1 1 0 1 0 2 0v-2a1 1 0 0 0-1-1"
                  />
                </svg>
              </div>
              <h3>AI Support</h3>
              <p>
                Our AI assistant helps you express how you feel, understand your
                emotions, and receive personalized coping guidance in real time.
              </p>
            </div>

            <div className="info-card">
              <div className="card-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 15 15"
                  className="feature-svg"
                >
                  <path
                    fill="currentColor"
                    d="M5.5 7A2.5 2.5 0 0 1 3 4.5v-2a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v2a3.49 3.49 0 0 0 1.51 2.87A4.4 4.4 0 0 1 5 10.5a3.5 3.5 0 1 0 7 0v-.57a2 2 0 1 0-1 0v.57a2.5 2.5 0 0 1-5 0a4.4 4.4 0 0 1 1.5-3.13A3.49 3.49 0 0 0 9 4.5v-2A1.5 1.5 0 0 0 7.5 1H7a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v2A2.5 2.5 0 0 1 5.5 7m6 2a1 1 0 1 1 0-2a1 1 0 0 1 0 2"
                  />
                </svg>
              </div>
              <h3>Professional Support Access</h3>
              <p>
                Connect privately with licensed mental health professionals
                through secure conversations designed for comfort and
                confidentiality.
              </p>
            </div>

            <div className="info-card">
              <div className="card-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="feature-svg"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M12 2.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5M8.75 4.5a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0M12 9.77a6 6 0 0 0-.86.052l-.892.15c-2.013.339-3.498 2.102-3.498 4.178a3.25 3.25 0 0 1-1.43 2.696l-.1.069a3.4 3.4 0 0 1-.823.406l-1.157.39a.75.75 0 0 1-.48-1.422l1.159-.39q.246-.083.462-.228l.102-.069a1.75 1.75 0 0 0 .767-1.452c0-2.797 2.003-5.195 4.748-5.657l.89-.15A7 7 0 0 1 12 8.271a7 7 0 0 1 1.112.072l.89.15c2.746.462 4.748 2.86 4.748 5.657c0 .586.29 1.13.768 1.452l.101.069q.217.145.463.228l1.158.39a.75.75 0 0 1-.48 1.422l-1.157-.39a3.4 3.4 0 0 1-.822-.406l-.101-.069a3.25 3.25 0 0 1-1.43-2.696c0-2.076-1.485-3.839-3.497-4.178l-.892-.15a6 6 0 0 0-.86-.051m-3.1 5.78a.75.75 0 1 1 1.2.9l-.924 1.233l-.022.029a5 5 0 0 1-.34.42a2.75 2.75 0 0 1-1.007.67c-.155.058-.316.098-.52.15l-.035.008l-1.794.449a.935.935 0 0 0 .227 1.841h.684c1.546 0 3.05-.501 4.287-1.429L12.55 18.4a.75.75 0 1 1 .9 1.2l-.904.678l.491.185c.534.2.775.29 1.017.366a9.3 9.3 0 0 0 2.243.407c.253.014.51.014 1.08.014h.939a.935.935 0 0 0 .226-1.841l-1.473-.369l-.082-.02c-.476-.119-.851-.212-1.186-.406a3 3 0 0 1-.29-.192c-.308-.234-.54-.543-.833-.936l-.051-.067l-.727-.969a.75.75 0 1 1 1.2-.9l.727.969c.368.491.471.618.591.709q.063.046.132.087c.13.075.287.121.883.27l1.473.368a2.435 2.435 0 0 1-.59 4.797h-.963c-.539 0-.84 0-1.14-.017a10.8 10.8 0 0 1-2.607-.473c-.286-.09-.567-.195-1.072-.384l-1.432-.537a8.65 8.65 0 0 1-4.733 1.411h-.684a2.435 2.435 0 0 1-.59-4.797l1.793-.448c.255-.064.324-.082.384-.105c.173-.066.33-.17.458-.304c.044-.047.088-.102.246-.313z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3>Personalized Wellness Tools</h3>
              <p>
                Access guided breathing exercises, journaling prompts, and
                stress-management techniques tailored to your emotional state
                and personal needs.
              </p>
            </div>
          </div>
        </section>

        <section className="resources-section">
          <div className="resources-left">
            <h2>
              Explore
              <br />
              <span>Resources</span>
            </h2>

            <p className="resources-subtitle">
              Some of the mental health resources
            </p>

            <div className="resource-list">
              <div className="resource-card">
                <div className="resource-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    className="resource-svg"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7S9 1 2 6v22c7-5 14 0 14 0s7-5 14 0V6c-7-5-14 1-14 1m0 0v21"
                    />
                  </svg>
                </div>
                <div>
                  <h3>Understanding Stress: A youth guide</h3>
                  <p>
                    Learn what stress is, how it affects your body and mind, and
                    simple ways to manage it in your daily...
                  </p>
                </div>
              </div>

              <div className="resource-card">
                <div className="resource-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="resource-svg"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 15.75v-7.5a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2m17.168-8.759l-4 3.563a.5.5 0 0 0-.168.373v1.778a.5.5 0 0 0 .168.373l4 3.563a.5.5 0 0 0 .832-.374V7.365a.5.5 0 0 0-.832-.374"
                    />
                  </svg>
                </div>
                <div>
                  <h3>Guided Meditation for Anxiety</h3>
                  <p>
                    A gentle guided meditation designed to help ease anxious
                    thoughts and feelings...
                  </p>
                </div>
              </div>

              <div className="resource-card">
                <div className="resource-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    className="resource-svg"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7S9 1 2 6v22c7-5 14 0 14 0s7-5 14 0V6c-7-5-14 1-14 1m0 0v21"
                    />
                  </svg>
                </div>
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
            <img
              src={meditationImage}
              alt="Meditation session"
              className="resources-image"
            />
          </div>
        </section>

        <section className="works-section">
          <h2>
            How <span>Serenilink</span> Works
          </h2>

          <div className="steps">
            <div className="step-box">
              <div className="step-number">1</div>
              <p>
                Browse Educational Contents and try some of the calming tools.
              </p>
            </div>

            <div className="step-box">
              <div className="step-number">2</div>
              <p>
                Create an anonymous account to save progress and book
                appointments.
              </p>
            </div>

            <div className="step-box">
              <div className="step-number">3</div>
              <p>
                Use AI assistance, take assessments and connect with counselors.
              </p>
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
              <div className="tool-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="tool-svg"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M6.25 5.5A3.25 3.25 0 1 1 9.5 8.75H3a.75.75 0 0 1 0-1.5h6.5A1.75 1.75 0 1 0 7.75 5.5v.357a.75.75 0 1 1-1.5 0zm8 2a4.25 4.25 0 1 1 4.25 4.25H2a.75.75 0 0 1 0-1.5h16.5a2.75 2.75 0 1 0-2.75-2.75V8a.75.75 0 0 1-1.5 0zm-11 6.5a.75.75 0 0 1 .75-.75h14.5a4.25 4.25 0 1 1-4.25 4.25V17a.75.75 0 0 1 1.5 0v.5a2.75 2.75 0 1 0 2.75-2.75H4a.75.75 0 0 1-.75-.75"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3>Breathing Bubble</h3>
              <p>Follow the animated bubble to calm your breathing</p>
            </div>

            <div className="tool-card">
              <div className="tool-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="tool-svg"
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  >
                    <path d="M3.182 12.808C4.233 14.613 7.195 18.81 12 18.81c4.813 0 7.77-4.199 8.82-6.002a1.6 1.6 0 0 0-.001-1.615C19.769 9.389 16.809 5.19 12 5.19s-7.768 4.197-8.818 6.001a1.6 1.6 0 0 0 0 1.617Z" />
                    <path d="M12 14.625a2.625 2.625 0 1 0 0-5.25a2.625 2.625 0 0 0 0 5.25Z" />
                  </g>
                </svg>
              </div>
              <h3>5-4-3-2-1 Grounding</h3>
              <p>Ground yourself in the present moment.</p>
            </div>
          </div>
        </section>
        <Link
          to="/guest-ai"
          className="home-chat-btn"
          title="Chat with SereniLink AI"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="chat-svg"
          >
            <path
              fill="currentColor"
              d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z"
            />
          </svg>
        </Link>
      </div>
    );
}

export default Home;