import React from "react";
import { Link } from "react-router-dom";
import "./Counselors.css";

import counselor1 from "../../assets/counselors/counselor1.jpg";
import counselor2 from "../../assets/counselors/counselor2.jpg";
import counselor3 from "../../assets/counselors/counselor3.jpg";
import counselor4 from "../../assets/counselors/counselor4.jpg";
import counselor5 from "../../assets/counselors/counselor5.jpg";
import counselor6 from "../../assets/counselors/counselor6.jpg";
import counselor7 from "../../assets/counselors/counselor7.jpg";
import counselor8 from "../../assets/counselors/counselor8.jpg";
import counselor9 from "../../assets/counselors/counselor9.jpg";

function Counselors() {
  const counselors = [
    {
      id: 1,
      image: counselor1,
      name: "Dr Jean Bosco Nkurunziza",
      title: "Clinical Psychologist",
      description:
        "Jean Bosco has extensive experience supporting individuals struggling with depression, low motivation, and emotional distress. He helps clients build resilience and regain a sense of purpose.",
    },
    {
      id: 2,
      image: counselor2,
      name: "Dr Aline Uwimana",
      title: "Licensed Mental Health Counselor",
      description:
        "Dr. Aline focuses on helping individuals manage anxiety, stress, and emotional overwhelm. She works with students and young professionals who are facing academic, work, or personal pressures.",
    },
    {
      id: 3,
      image: counselor3,
      name: "Diane Mukamana",
      title: "Youth & Family Counselor",
      description:
        "Dr. Diane works with teenagers and young adults dealing with academic stress, identity challenges, and social pressure.",
    },
    {
      id: 4,
      image: counselor4,
      name: "Dr Patrick Habimana",
      title: "Licensed Psychotherapist",
      description:
        "Patrick supports individuals and couples dealing with relationship conflicts, communication difficulties, and life transitions.",
    },
    {
      id: 5,
      image: counselor5,
      name: "Claudine Nyirabazimana",
      title: "Mental Health Therapist",
      description:
        "Claudine works with professionals experiencing burnout, work-related stress, and emotional exhaustion.",
    },
    {
      id: 6,
      image: counselor6,
      name: "Emmanuel Mugenzi",
      title: "Behavioral Health Counselor",
      description:
        "Emmanuel specializes in helping clients overcome anxiety attacks and excessive worry through practical coping techniques.",
    },
    {
      id: 7,
      image: counselor7,
      name: "Eric Ndayambaje",
      title: "Wellness & Mental Health Coach",
      description:
        "Eric works with individuals seeking to improve self-confidence, motivation, and overall life direction.",
    },
    {
      id: 8,
      image: counselor8,
      name: "Dr Alex Makoko",
      title: "Licensed Psychotherapist",
      description:
        "Dr. Alex supports individuals and couples dealing with relationship conflicts, communication difficulties, and life transitions.",
    },
    {
      id: 9,
      image: counselor9,
      name: "Dr Chantal Uwase",
      title: "Psychologist",
      description:
        "Dr. Chantal supports individuals recovering from traumatic experiences and emotional distress by helping them rebuild emotional stability.",
    },
  ];

  return (
    <div className="counselors-page">
      <section className="counselors-hero-section">
        <div className="counselors-shape counselors-shape-left"></div>
        <div className="counselors-shape counselors-shape-top"></div>
        <div className="counselors-shape counselors-shape-middle"></div>
        <div className="counselors-shape counselors-shape-right"></div>

        <div className="counselors-hero-content">
          <div className="counselors-hero-text">
            <h1>
              Find The Right <span>Counselors</span> For You
            </h1>
            <p>
              Browse verified counselors ready to support your mental wellbeing.
            </p>

            <Link to="/register" className="counselors-btn">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="counselors-list-section">
        <div className="counselors-top-bar">
          <div className="search-box">
            <span className="search-icon-wrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="search-icon"
              >
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
                />
              </svg>
            </span>

            <input
              type="text"
              placeholder="Search counselors"
              className="counselors-search"
            />
          </div>

          <select className="counselors-filter">
            <option>Filter Counselors Professions</option>
            <option>Psychologist</option>
            <option>Psychotherapist</option>
            <option>Youth Counselor</option>
            <option>Mental Health Coach</option>
          </select>
        </div>

        <div className="counselors-grid">
          {counselors.map((counselor) => (
            <div className="counselor-card" key={counselor.id}>
              <img
                src={counselor.image}
                alt={counselor.name}
                className="counselor-image"
              />

              <div className="counselor-card-body">
                <h3>{counselor.name}</h3>
                <h4>{counselor.title}</h4>
                <p>{counselor.description}</p>

                <Link to="/login" className="book-btn">
                  Book Session
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="view-more-wrap">
          <button className="view-more-btn">View More</button>
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

export default Counselors;