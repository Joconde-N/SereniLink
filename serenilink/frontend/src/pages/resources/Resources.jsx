import React from "react";
import { Link } from "react-router-dom";
import "./Resources.css";

import featuredVideo from "../../assets/resources/featured-video.jpg";
import featuredMusic from "../../assets/resources/featured-music.jpg";
import featuredArticle from "../../assets/resources/featured-article.jpg";

import video1 from "../../assets/resources/video-1.jpg";
import music1 from "../../assets/resources/music-1.jpg";
import article1 from "../../assets/resources/article-1.jpg";
import video2 from "../../assets/resources/video-2.jpg";
import music2 from "../../assets/resources/music-2.jpg";
import article2 from "../../assets/resources/article-2.jpg";

function Resources() {
  const featuredResources = [
    {
      id: 1,
      type: "video",
      image: featuredVideo,
      badge: "12:45",
      title: "Guided Breathing Exercise: Find Your Calm",
      meta: "Video | Calming Exercise",
      action: "Watch Now",
    },
    {
      id: 2,
      type: "music",
      image: featuredMusic,
      badge: "45:00",
      title: "Peaceful Mind: Relaxing Music",
      meta: "Music | Calming Soundtrack",
      action: "Listen Now",
    },
    {
      id: 3,
      type: "article",
      image: featuredArticle,
      badge: "Article",
      title: "Understanding Stress: A Youth Guide",
      meta: "April 10, 2024 | Article",
      action: "Read Now",
    },
  ];

  const allResources = [
    {
      id: 4,
      type: "video",
      image: video1,
      badge: "14:32",
      title: "Mindful Meditation for Beginners",
      meta: "Video | Calming Exercise",
      action: "Watch Now",
    },
    {
      id: 5,
      type: "music",
      image: music1,
      badge: "60:00",
      title: "Soothing Forest Sounds",
      meta: "Music | Calming Soundtrack",
      action: "Listen Now",
    },
    {
      id: 6,
      type: "article",
      image: article1,
      badge: "Article",
      title: "The Power of Journaling",
      meta: "March 22, 2024 | Article",
      action: "Read Now",
    },
    {
      id: 7,
      type: "video",
      image: video2,
      badge: "11:20",
      title: "Coping Strategies During Tough Times",
      meta: "Video | Calming Exercise",
      action: "Watch Now",
    },
    {
      id: 8,
      type: "music",
      image: music2,
      badge: "50:00",
      title: "Sleepy Serenity Sounds",
      meta: "Music | Calming Soundtrack",
      action: "Listen Now",
    },
    {
      id: 9,
      type: "article",
      image: article2,
      badge: "Article",
      title: "Building Healthy Sleep Habits",
      meta: "April 2, 2024 | Article",
      action: "Read Now",
    },
  ];

  return (
    <div className="resources-page">
      <section className="resources-hero-section">
        <div className="resources-shape resources-shape-left"></div>
        <div className="resources-shape resources-shape-top"></div>
        <div className="resources-shape resources-shape-small"></div>

        <div className="resources-hero-content">
          <h1>Resources</h1>
          <p>
            Explore videos, music, and articles curated to support your mental
            health journey.
          </p>

          <div className="resources-toolbar">
            <div className="resources-search-box">
              <span className="resources-search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="toolbar-svg">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
                  />
                </svg>
              </span>

              <input
                type="text"
                placeholder="Search resources"
                className="resources-search-input"
              />
            </div>

            <div className="resources-filter-box">
              <span>Filter by Type</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="toolbar-svg filter-svg">
                <path
                  fill="currentColor"
                  d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25c0 .53-.187 1.042-.528 1.447L14.25 14v4.19c0 .344-.177.663-.469.844l-3 1.875A1 1 0 0 1 9.25 20v-6L3.528 6.697A2.25 2.25 0 0 1 3 5.25"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="resources-main-section">
        <div className="section-heading-row">
          <h2>Featured Resources</h2>
          <div className="section-line"></div>
        </div>

        <div className="resources-grid featured-grid">
          {featuredResources.map((item) => (
            <div className="resource-item-card" key={item.id}>
              <div className="resource-image-wrap">
                <img src={item.image} alt={item.title} className="resource-item-image" />

                <div className="resource-badge">{item.badge}</div>

                {item.type === "video" && (
                  <div className="resource-center-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="play-svg">
                      <path fill="currentColor" d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82" />
                    </svg>
                  </div>
                )}

                {item.type === "music" && (
                  <div className="resource-center-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="play-svg">
                      <path fill="currentColor" d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82" />
                    </svg>
                  </div>
                )}

                {item.type === "article" && (
                  <div className="resource-corner-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="corner-svg">
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
                )}
              </div>

              <div className="resource-item-body">
                <h3>{item.title}</h3>
                <p className="resource-meta">{item.meta}</p>

                <Link to="/login" className="resource-action-btn">
                  {item.action}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="section-heading-row all-row">
          <h2>All Resources</h2>
          <div className="section-line"></div>
        </div>

        <div className="resource-tabs">
          <button className="resource-tab active">All</button>
          <button className="resource-tab">Videos</button>
          <button className="resource-tab">Music</button>
          <button className="resource-tab">Articles</button>
        </div>

        <div className="resources-grid all-grid">
          {allResources.map((item) => (
            <div className="resource-item-card" key={item.id}>
              <div className="resource-image-wrap">
                <img src={item.image} alt={item.title} className="resource-item-image" />
                <div className="resource-badge">{item.badge}</div>

                {item.type === "video" && (
                  <div className="resource-corner-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="corner-svg">
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
                )}

                {item.type === "music" && (
                  <div className="resource-corner-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="corner-svg">
                      <path
                        fill="currentColor"
                        d="M12 3a1 1 0 0 1 1 1v9.382A3.5 3.5 0 1 1 11 10.1V7.9l8-2V15.5a3.5 3.5 0 1 1-2-3.15V4a1 1 0 0 1 1-1"
                      />
                    </svg>
                  </div>
                )}

                {item.type === "article" && (
                  <div className="resource-corner-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="corner-svg">
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
                )}
              </div>

              <div className="resource-item-body">
                <h3>{item.title}</h3>
                <p className="resource-meta">{item.meta}</p>

                <Link to="/login" className="resource-action-btn">
                  {item.action}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="view-more-wrap">
          <button className="view-more-btn">View More</button>
        </div>
      </section>

      <Link to="/guest-ai" className="resources-chat-btn" title="Chat with SereniLink AI">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-svg">
          <path fill="currentColor" d="M3 12c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9v3l-3-3zm18 6c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-6v1c0 2.2-1.8 4-4 4v2c0 1.1.9 2 2 2h2v3l3-3z"/>
        </svg>
      </Link>
    </div>
  );
}

export default Resources;