import React from "react";
import { Link } from "react-router-dom";
import "./About.css";
import { HandFist, HatGlasses, LockKeyholeOpen } from "lucide-react";

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
              <HatGlasses className="value-svg" />
            </div>
            <h3>Confidentiality</h3>
            <p>We protect user privacy and ensure secure communication.</p>
          </div>

          <div className="value-card value-left">
            <div className="value-icon">
              <LockKeyholeOpen className="value-svg" />
            </div>
            <h3>Accessibility</h3>
            <p>Support should be available to every young person.</p>
          </div>

          <div className="value-card value-right">
            <div className="value-icon">
              <HandFist className="value-svg" />
            </div>
            <h3>Empowerment</h3>
            <p>
              We equip youth with tools to manage their emotional well-being.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="about-chat-btn"
        title="Chat with SereniLink AI"
        onClick={() => window.dispatchEvent(new Event("open-guest-chat"))}
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
      </button>
    </div>
  );
}

export default About;