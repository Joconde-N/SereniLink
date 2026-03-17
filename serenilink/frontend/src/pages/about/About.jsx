import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

import aboutHeroImage from "../../assets/about-hero-woman.png";
import missionImage from "../../assets/mental-health-laptop.png";

function About() {
  return (
    <div className="about-page">
      <section className="about-hero-section">
        <div className="about-shape about-shape-left"></div>
        <div className="about-shape about-shape-top"></div>
        <div className="about-shape about-shape-middle"></div>
        <div className="about-shape about-shape-bottom"></div>

        <div className="about-hero-content">
          <div className="about-hero-text">
            <h1>
              About <span>SereniLink</span>
            </h1>
            <p>A digital youth mental health support platform.</p>

            <Link to="/register" className="about-btn">
              Get Started
            </Link>
          </div>
        </div>

        <div className="about-hero-image-wrap">
          <img
            src={aboutHeroImage}
            alt="Young woman seated calmly"
            className="about-hero-image"
          />
        </div>
      </section>

      <section className="who-section">
        <h2>
          Who are <span>we</span>?
        </h2>

        <div className="who-box">
          <p>
            SereniLink is a digital youth mental health support platform
            designed to provide safe, confidential, and accessible emotional
            care for young people. We combine AI guidance, direct access to
            licensed mental health professionals, and personalized wellness
            tools to help youth navigate stress, anxiety, academic pressure, and
            life challenges in a supportive environment.
          </p>
        </div>
      </section>

      <section className="mission-section">
        <div className="mission-image-wrap">
          <img
            src={missionImage}
            alt="Mental health content on a laptop"
            className="mission-image"
          />
        </div>

        <div className="mission-text">
          <h2>
            Our <span>Mission</span> & <br />
            Purpose
          </h2>

          <p>
            We’re here to make mental health support easy to access,
            youth-friendly, and free from stigma. Through the use of technology,
            connecting young people to the help they need.
          </p>

          <p>
            The goal is to provide a safe and supportive digital space where
            youth can express their feelings, learn about mental well-being, and
            receive guidance whenever they need it.
          </p>
        </div>
      </section>

      <section className="vision-section">
        <div className="vision-box">
          <h2>
            Our <span>Vision</span>
          </h2>
          <p>
            A future where young people feel confident speaking about their
            mental health, supported without judgment, and empowered to build
            strong emotional well-being in their everyday lives.
          </p>
        </div>
      </section>

      <section className="values-section">
        <h2>
          Our Core <span>Values</span>
        </h2>

        <div className="values-rings"></div>

        <div className="values-grid">
          <div className="value-card value-top">
            <div className="value-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="value-svg"
              >
                <path
                  fill="currentColor"
                  d="M13.063 4c-.876 0-1.645.45-2.188 1.031c-.543.582-.934 1.309-1.281 2.094c-.531 1.21-.91 2.555-1.25 3.813c-1.086.316-2.008.71-2.75 1.187C4.727 12.684 4 13.457 4 14.5c0 .906.555 1.633 1.25 2.156c.594.446 1.324.817 2.188 1.125c.05.23.125.465.218.688c-.843.476-2.18 1.398-3.468 3.156l-.594.844l.844.593l3.28 2.25L6.376 28h19.25l-1.344-2.688l3.282-2.25l.843-.593l-.593-.844c-1.29-1.758-2.625-2.68-3.47-3.156a4 4 0 0 0 .22-.688c.863-.308 1.593-.68 2.187-1.125c.695-.523 1.25-1.25 1.25-2.156c0-1.043-.727-1.816-1.594-2.375c-.742-.477-1.664-.871-2.75-1.188c-.375-1.304-.789-2.671-1.312-3.874c-.34-.778-.715-1.493-1.25-2.063s-1.297-1-2.157-1c-.582 0-1.023.16-1.5.281c-.476.121-.957.219-1.437.219c-.96 0-1.766-.5-2.938-.5"
                />
              </svg>
            </div>
            <h3>Confidentiality</h3>
            <p>We protect user privacy and ensure secure communication.</p>
          </div>

          <div className="value-card value-left">
            <div className="value-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="value-svg"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M6.5 6.5a5.5 5.5 0 1 1 11 0v5.17a7 7 0 1 1-2-1.733V6.5a3.5 3.5 0 1 0-7 0V8h-2zM12 11a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3>Accessibility</h3>
            <p>Support should be available to every young person.</p>
          </div>

          <div className="value-card value-right">
            <div className="value-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 14 14"
                className="value-svg"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                >
                  <path d="M3.901 13.407v-2.464c-1.304-.452-2.18-1.97-2.18-3.754c0-1.063.24-2.174 1.42-2.174h2.993a1.111 1.111 0 0 1 .322 2.174l-1.71.519c.874 0 1.948.83 1.925 1.905m3.144 3.795v-2.465s.587-.293 1.2-.88c1.181-1.131 1.335-2.919 1.016-4.523c-.107-.534-.26-1.076-.477-1.532m-8.886.934V3.056a1.478 1.478 0 0 1 2.957 0v1.886" />
                  <path d="M5.625 4.554V2.072a1.48 1.48 0 1 1 2.959 0v2.482a1.48 1.48 0 0 1-1.365 1.474" />
                  <path d="M8.584 3.057a1.479 1.479 0 1 1 2.957 0v1.27a1.479 1.479 0 1 1-2.957 0z" />
                </g>
              </svg>
            </div>
            <h3>Empowerment</h3>
            <p>
              We equip youth with tools to manage their emotional well-being.
            </p>
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

export default About;