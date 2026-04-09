import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import slideLogo1 from '../../assets/images/icon/star-icon.png';
import { getEventDetails } from '../../../utils/api';

const fallbackTags = ['Magic of Events', 'Celebrate Life'];

export default function SlidingText() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3';
  const [tags, setTags] = useState(fallbackTags);

  useEffect(() => {
    let mounted = true;

    const fetchEventTags = async () => {
      try {
        const data = await getEventDetails(eventId);
        if (!mounted) return;

        const nextTags = Array.isArray(data?.tags)
          ? data.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
          : [];

        setTags(nextTags.length > 0 ? nextTags : fallbackTags);
      } catch (error) {
        console.error('Failed to fetch event tags for sliding text:', error);
        if (mounted) {
          setTags(fallbackTags);
        }
      }
    };

    fetchEventTags();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const marqueeTags = useMemo(() => {
    if (tags.length === 0) return fallbackTags;
    return [...tags, ...tags];
  }, [tags]);

  return (
    <>
      {/* Sliding Text Start */}
      <section className="sliding-text-one">
        <div className="sliding-text-one__wrap">
          <ul className="sliding-text__list marquee_mode">
            {marqueeTags.map((tag, index) => (
              <li key={`${tag}-${index}`}>
                <h2 data-hover={tag} className="sliding-text__title">
                  {tag}
                  <img src={slideLogo1} alt="Star Icon" />
                </h2>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* Sliding Text End */}
    </>
  );
}
