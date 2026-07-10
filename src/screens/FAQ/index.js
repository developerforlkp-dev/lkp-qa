import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getSupportGuest } from "../../utils/api";
import styles from "./FAQ.module.sass";

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.open : ""}`}>
      <button className={styles.questionButton} onClick={onClick}>
        <h3 className={styles.questionText}>{question}</h3>
        <ChevronDown
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
          size={20}
        />
      </button>
      <div
        className={styles.answerContainer}
        style={{
          maxHeight: isOpen ? "500px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={styles.answerContent}>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [openIndices, setOpenIndices] = useState({ 0: true });
  const [loading, setLoading] = useState(true);

  const toggleOpen = (index) => {
    setOpenIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await getSupportGuest();
        if (data && data.faqs) {
          // Sort FAQs by sortOrder
          const sortedFaqs = data.faqs.sort((a, b) => a.sortOrder - b.sortOrder);
          setFaqs(sortedFaqs);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>
        <p className={styles.subtitle}>
          Everything you need to know about Little Known Planet.
        </p>
      </div>
      
      <div className={styles.faqList}>
        {faqs.length > 0 ? (
          faqs.map((faq, index) => (
            <FAQItem
              key={faq.supportFaqId}
              question={faq.question}
              answer={faq.answer}
              isOpen={!!openIndices[index]}
              onClick={() => toggleOpen(index)}
            />
          ))
        ) : (
          <p className={styles.noFaqs}>No FAQs available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default FAQ;
