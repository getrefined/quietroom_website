/**
 * Fallback content for every page, in Prismic's slice shape (see docs/build-plan.md).
 *
 * This file is the single source of truth for the site copy: Astro renders it when a
 * Prismic document is missing or unpublished, and the Prismic migration script pushes the
 * same objects as documents. Edit copy here, then re-run the migration to sync Prismic.
 */
import { para, h3, rt, web, page, noLink, img, slice } from './rt.mjs';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1920&q=80';

const headshot = img(
  'images/christopher-journeaux.jpg',
  'Christopher Journeaux, psychotherapist, counsellor and clinical supervisor',
  450,
  300
);
const roomChairs = img(
  'images/therapy-room-chairs.jpg',
  'The Quiet Room therapy room in St Helier: two armchairs, a lamp and plants',
  521,
  295
);
const roomSofa = img(
  'images/therapy-room-sofa.png',
  'The Quiet Room therapy room: sofa, armchair and window',
  531,
  298
);

const ukcp = {
  logo: img('images/badge-ukcp.jpg', 'UKCP, UK Council for Psychotherapy', 154, 103),
  name: 'UKCP registered',
  link: web('https://www.psychotherapy.org.uk/', 'UKCP'),
};
const gpsyc = {
  logo: img('images/badge-gpsyc.png', 'GPsyC, General Psychotherapy Council', 180, 68),
  name: 'GPsyC',
  link: noLink(),
};

export const settings = {
  site_name: 'Quiet Room Therapy',
  tagline: 'Counselling, psychotherapy and clinical supervision in Jersey',
  practitioner_name: 'Christopher Journeaux',
  practitioner_title:
    'BSc MBPsS Dip. Sup. · UKCP Registered Clinical Psychotherapist and Supervisor · GPsyC',
  phone: '07797 736595',
  email: 'christopher@thequietroom.co.uk',
  address: para('Suite 4, Bourne House', 'Francis Street', 'St Helier', 'Jersey JE2 4QE'),
  footer_note: para(
    'A UKCP and Jersey Care Commission registered counsellor and psychotherapist working with adults and young people over 11, online and in St Helier.'
  ),
  accreditations: [ukcp, gpsyc],
};

const ctaBook = slice('cta_band', {
  heading: [{ type: 'heading2', text: 'Book your first appointment today', spans: [] }],
  text: para(
    'Get in touch to arrange a free initial consultation, in my therapy room in St Helier or online via Google Meet.'
  ),
  primary_link: page('contact', 'Contact me'),
  secondary_link: web('tel:+447797736595', 'Call 07797 736595'),
});

const accreditations = slice('accreditations', {
  heading: 'Registered and accredited',
  text: para(
    'UKCP registered clinical psychotherapist and supervisor, GPsyC registered, and registered with the Jersey Care Commission.'
  ),
  items: [ukcp, gpsyc],
});

export const pages = {
  home: {
    title: 'Counselling and Psychotherapy in Jersey',
    description:
      'Professional counselling, psychotherapy and clinical supervision in St Helier, Jersey, with Christopher Journeaux, an experienced UKCP registered psychotherapist. Book your first appointment today.',
    slices: [
      slice('hero', {
        eyebrow: 'Counselling and Psychotherapy in Jersey',
        heading: [{ type: 'heading1', text: 'Welcome to Quiet Room Therapy', spans: [] }],
        text: para(
          'Professional psychotherapy, counselling and therapy services with an experienced and qualified psychotherapist, counsellor and clinical supervisor. A UKCP and Jersey Care Commission registered counsellor and psychotherapist in Jersey.'
        ),
        primary_link: page('contact', 'Contact me'),
        secondary_link: page('psychotherapy', 'What is psychotherapy?'),
        image: img(HERO_IMAGE, 'Calm morning light over still water', 1920, 1280),
        highlights: [
          { label: 'UKCP registered' },
          { label: 'Over 12 years of clinical practice' },
          { label: 'Adults, young people over 11 and supervision' },
        ],
      }),
      slice('intro_block', {
        eyebrow: 'You are not alone',
        heading: [
          { type: 'heading2', text: 'Are you feeling overwhelmed, anxious, or stuck?', spans: [] },
        ],
        text: para(
          "Reaching out for support can be difficult, but you're not alone, and help is closer than you think. Whether you're searching for help with anxiety, wondering how to deal with depression, trauma, or seeking marriage problems therapy, I'm here to support you on your journey to healing and growth.",
          'As a qualified, registered and experienced psychotherapist and counsellor in Jersey, I offer a safe, confidential space for teens and adults to explore their emotional well-being and develop tools for meaningful change.'
        ),
        image: headshot,
        image_position: 'right',
        link: page('about', 'More about me'),
        credentials: [
          { label: 'Christopher Journeaux BSc MBPsS Dip. Sup.' },
          { label: 'UKCP Registered Clinical Psychotherapist and Supervisor' },
          { label: 'GPsyC' },
        ],
      }),
      slice('feature_columns', {
        eyebrow: 'Professional counselling and psychotherapy in Jersey',
        heading: [
          { type: 'heading2', text: 'For adults, teens and clinical supervision', spans: [] },
        ],
        text: para(
          "If this is what you seek, you've found the right place. With over 12 years of clinical practice, I bring compassion, professionalism, and insight to every client relationship."
        ),
        background: 'grey',
        items: [
          {
            icon: 'shield',
            title: 'A safe, confidential space',
            text: para(
              'An open, quiet space into which you can walk and explore your feelings, thoughts and experiences without the baggage of assumption.'
            ),
          },
          {
            icon: 'compass',
            title: 'A tailored approach',
            text: para(
              'One size does not fit all. I draw on Humanistic, Existential, Gestalt and Attachment approaches to suit your needs.'
            ),
          },
          {
            icon: 'award',
            title: 'Qualified and registered',
            text: para(
              "I've studied both psychotherapy and counselling, and continue to learn from my clients, students, and life itself."
            ),
          },
        ],
      }),
      slice('service_cards', {
        eyebrow: 'How I can help',
        heading: [
          { type: 'heading2', text: 'Psychotherapy, counselling and supervision', spans: [] },
        ],
        text: para(
          'In addition to working with individuals I also serve as a clinical supervisor, supporting both experienced therapists and trainees.'
        ),
        columns: '3',
        items: [
          {
            icon: 'leaf',
            title: 'Psychotherapy and counselling',
            text: para(
              'Individual therapy for adults and young people over 11, in my therapy room in St Helier or online.'
            ),
            link: page('psychotherapy', 'About psychotherapy'),
          },
          {
            icon: 'users',
            title: 'Clinical supervision',
            text: para(
              'Structured, supportive supervision for practitioners, trainees and agencies, one to one or in groups.'
            ),
            link: page('supervision', 'About supervision'),
          },
          {
            icon: 'calendar',
            title: 'Booking a session',
            text: para(
              'A free initial consultation to meet, talk about what you need and decide whether working together feels right.'
            ),
            link: page('booking', 'How booking works'),
          },
        ],
      }),
      slice('narrative', {
        eyebrow: 'Take the first step',
        heading: [
          {
            type: 'heading2',
            text: "Your mental well-being is not a luxury, it's a right",
            spans: [],
          },
        ],
        body: para(
          "If you're ready to begin your journey toward healing, growth, and self-understanding, I invite you to get in touch.",
          'I am a Psychotherapist and Clinical Supervisor working with both adults and children online and in my therapy room just off La Colomberie on Francis Street. It is conveniently located a short walk from Green Street car park. I work hours that can match your life and work needs.'
        ),
        image: roomChairs,
        layout: 'image-right',
        background: 'white',
      }),
      accreditations,
      ctaBook,
    ],
  },

  about: {
    title: 'About Christopher Journeaux',
    description:
      'Christopher Journeaux is an experienced, qualified psychotherapist, counsellor and clinical supervisor in Jersey with over 12 years of clinical experience.',
    slices: [
      slice('page_header', {
        eyebrow: 'About me',
        heading: [
          { type: 'heading1', text: 'Psychotherapist, Counsellor and Therapist', spans: [] },
        ],
        text: para(
          'Professional psychotherapy and counselling services with an experienced, qualified therapist. Book your appointment today.'
        ),
      }),
      slice('intro_block', {
        eyebrow: 'Hello and welcome to my page',
        heading: [{ type: 'heading2', text: 'Christopher Journeaux', spans: [] }],
        text: para(
          'I am an experienced, qualified Psychotherapist, Counsellor and clinical supervisor with over 12 years of clinical experience working with clients. I offer professional Psychotherapy and Counselling services.'
        ),
        image: headshot,
        image_position: 'left',
        link: page('booking', 'Book a session'),
        credentials: [
          { label: 'BSc (Hons) Psychology' },
          {
            label: 'Post Graduate Diploma (Masters Level) in Relational Integrative Psychotherapy',
          },
          { label: 'Post Qualifying Diploma in Counselling Children and Young People, Level 7' },
          {
            label:
              'Terapia Diploma in Child, Adolescent and Adult Psychotherapy and Counselling Supervision',
          },
          { label: 'UKCP Registered Clinical Psychotherapist and Supervisor' },
          { label: 'MBPsS · GPsyC' },
        ],
      }),
      slice('narrative', {
        eyebrow: 'My journey',
        heading: [{ type: 'heading2', text: 'From psychology to psychotherapy', spans: [] }],
        body: para(
          'My journey to Psychotherapy and Counselling has been a long one that finally saw me fulfilling a long-held ambition to study Psychology, securing a BSc (Hons) in 2010. At this point I found myself at the start of something, rather than the end, and was fortunate to be able to study Psychotherapy over a four-year programme in Jersey and France. Now, some 22 years after those first steps to begin my degree, and after more study with the European Centre for Psychotherapeutic Studies and Quality training UK to support children, I now work with both adults and children over 11. In addition, I trained to become a clinical supervisor through the [Terapia Diploma in Child, Adolescent and Adult Psychotherapy and Counselling Supervision](https://terapia.co.uk/course/supervision-training/).'
        ),
        image: roomSofa,
        layout: 'image-right',
        background: 'white',
      }),
      slice('narrative', {
        eyebrow: 'Teaching and training',
        heading: [{ type: 'heading2', text: 'Sharing an empowering vocation', spans: [] }],
        body: para(
          'Aside from my therapeutic practice I teach on a range of degrees and professional Counselling training courses that have Psychology, Psychotherapy and Counselling at their hearts. For University College Jersey I lecture on the Psychology with Criminology degree which launched in 2017 and previously Child Development for the Childhood Studies degree. I also lectured on the Psychology of Physical Activity for the Sport & Management degree. Professional training includes CPCAB Counselling Courses, Levels 2, 3 and Level 4 Diploma, sharing my love of this empowering vocation with students keen to find their own path as Counsellors.',
          'I have also undertaken training with Zoe Lodrick and New Pathways to enable me to work with survivors of rape and sexual abuse. I was a volunteer therapist with Jersey Action Against Rape (JAAR) for five years from its launch in 2015. I adhere to the Codes of Ethics and Practice of the European Institute for Psychotherapeutic Studies which is compatible with the codes of ethics and professional practice of UKCP and UKEATC, EIATCYP, EAGT, EAIP and EUROCPS Codes of Ethics.',
          'As well as a degree in Psychology I also hold a Post Graduate Diploma (Masters Level) in Relational Integrative Psychotherapy from the Scarborough Counselling and Psychotherapy Training Institute and a Post Qualifying Diploma in Counselling Children and Young People, Level 7.'
        ),
        layout: 'two-column',
        background: 'grey',
      }),
      accreditations,
      slice('cta_band', {
        heading: [{ type: 'heading2', text: 'Ready to talk?', spans: [] }],
        text: para(
          'I offer a free initial consultation to anyone wanting to explore psychotherapy.'
        ),
        primary_link: page('contact', 'Get in touch'),
        secondary_link: page('booking', 'How booking works'),
      }),
    ],
  },

  psychotherapy: {
    title: 'Psychotherapy and Counselling',
    description:
      'What are psychotherapy and counselling? An open, quiet space to explore your feelings, thoughts and experiences with Christopher Journeaux in Jersey.',
    slices: [
      slice('page_header', {
        eyebrow: 'Psychotherapy',
        heading: [{ type: 'heading1', text: 'What are Psychotherapy and Counselling?', spans: [] }],
        text: para(
          'An open, quiet space into which you can walk and explore your feelings, thoughts and experiences without the baggage of assumption.'
        ),
      }),
      slice('narrative', {
        eyebrow: 'Therapy belongs to the client',
        heading: [
          {
            type: 'heading2',
            text: 'Perhaps one of the toughest questions a client can ask',
            spans: [],
          },
        ],
        body: para(
          "Perhaps one of the toughest questions a client can ask, and not just clients. My counselling students often begin with that question; to start with a firm understanding of what therapy entails and what benefits it might bring. My experience of fear is that frequently it is dominated by the unknown. We are fearful of what we don't know, what we have yet to experience. We fill those gaps with something we have read or heard from others and then, sometimes, with thoughts that can seem dark and foreboding. New clients may search Counsellors near me or therapy for teens. They might search by desired treatment such as anxiety, depression or panic attacks. My answer, though, is often, initially at least, a disappointment: Psychotherapy and Counselling are about the client so their experience of it is personal; in essence the client owns it. So disappointing because it fails to fully remove the unknown element of Psychotherapy. To step into the therapy room and not know what this might mean, what happens once you have searched therapist near me.",
          "It may help to hear that, as a Psychotherapist, I don't know either. At least I don't know what the therapeutic process is going to be with a new client. Working without expectations can seem daunting but once I was used to that aspect to the work, I found it liberating. No client is indicative of any 'type', I can honour the truth and individuality that is the person sat in front of me. That may seem to contradict all of the experiences we've had in the past and probably the way we often treat others. All those stereotypes we use to try and make sense of the world and the people we meet. In therapy, though, assumptions can cloud the truth of who someone is.",
          'Psychotherapy, Counselling then, is an open, quiet space into which you can walk and explore your feelings, thoughts and experiences without the baggage of assumption. Therapy belongs to the client, and I think that might just be definition enough.'
        ),
        image: roomChairs,
        layout: 'image-right',
        background: 'white',
      }),
      ctaBook,
    ],
  },

  supervision: {
    title: 'Clinical Supervision',
    description:
      'Clinical supervision in Jersey for psychotherapists, counsellors, trainees and agencies: a structured, supportive space to reflect on your work, one to one or in groups, face to face or online.',
    slices: [
      slice('page_header', {
        eyebrow: 'Supervision',
        heading: [{ type: 'heading1', text: 'Clinical Supervision', spans: [] }],
        text: para(
          'Therapy supervision is an essential part of the professional development of all practitioners whether in private practice, working for an agency or embedded within a school.'
        ),
      }),
      slice('narrative', {
        eyebrow: 'A collaborative process',
        heading: [
          {
            type: 'heading2',
            text: 'A structured, supportive space to reflect on your work',
            spans: [],
          },
        ],
        body: para(
          "I provide a structured and supportive environment for therapists to reflect on their work, improve their skills, and ensure the well-being of their clients. Whether you're an experienced practitioner, student counsellor or psychotherapist I can support you in your work.",
          'I consider supervision a collaborative process where a supervisee works with a peer or a more experienced therapist to reflect on their clinical work. Working with me can help you gain insights into your therapeutic practice, reflect on working themes, untangle your own agenda from that of your clients, and manage the emotional and psychological challenges that can arise in therapeutic work.',
          "I use a Rogerian model in my approach to supervision which includes a focus on improving therapeutic skills; space to process your feelings, build resilience, and avoid burnout. I offer the collective goal of enhancing client outcomes working with you to feel fully equipped to handle difficult cases that directly benefit your clients' therapeutic progress. I am also a support with maintaining your ethical practice, helping you to ensure you are adhering to professional and ethical guidelines, protecting both you and your client."
        ),
        layout: 'prose',
        background: 'white',
      }),
      slice('feature_columns', {
        eyebrow: 'How we can work together',
        heading: [{ type: 'heading2', text: 'Individuals, agencies and groups', spans: [] }],
        text: para(
          'I am available to work with individual practitioners and agencies, one to one or in groups. I can meet face to face or online.'
        ),
        background: 'grey',
        items: [
          {
            icon: 'user',
            title: 'Who it is for',
            text: para(
              'Experienced practitioners, student counsellors and psychotherapists working with adults or children over 11 in Jersey.'
            ),
          },
          {
            icon: 'chat',
            title: 'How I work',
            text: para(
              'A Rogerian model: improving therapeutic skills, space to process your feelings, building resilience and avoiding burnout, and support with ethical practice.'
            ),
          },
          {
            icon: 'video',
            title: 'Where and when',
            text: para(
              'One to one or in groups, with individual practitioners or agencies, face to face in St Helier or online.'
            ),
          },
        ],
      }),
      slice('cta_band', {
        heading: [
          { type: 'heading2', text: 'Considering a new perspective on your practice?', spans: [] },
        ],
        text: para(
          'Whether you are seeking a different perspective in your work or starting out in your professional training and career, consider contacting me to see how we might work together.'
        ),
        primary_link: page('contact', 'Contact me'),
        secondary_link: noLink(),
      }),
    ],
  },

  services: {
    title: 'Services',
    description:
      'Help with anxiety, depression, relationship problems, trauma and work stress, plus clinical supervision, from an experienced psychotherapist and counsellor in Jersey.',
    slices: [
      slice('page_header', {
        eyebrow: 'Services',
        heading: [{ type: 'heading1', text: 'A tailored approach to your needs', spans: [] }],
        text: para(
          'Each client brings with them a personal history, set of experiences and issues unique to them. My view is that one size does not fit all in therapeutic work.'
        ),
      }),
      slice('narrative', {
        eyebrow: 'My approach',
        heading: [
          { type: 'heading2', text: 'Different approaches for different people', spans: [] },
        ],
        body: para(
          'A tailored approach to your needs is required in order for therapy to be most beneficial. I employ different theoretical approaches to my work, such as Humanistic, Existential, Gestalt, and Attachment Theory.',
          "I have experience of being a client in therapy and know how challenging this can sometimes be. Having walked that path myself and seen the work from 'both sides', I believe that this deepens my ability to truly empathise and relate to my clients.",
          "I am able to accept consultations across a range of life's challenges."
        ),
        layout: 'prose',
        background: 'white',
      }),
      slice('service_cards', {
        eyebrow: 'Areas I can help with',
        heading: [
          {
            type: 'heading2',
            text: 'Some of the areas for which I can typically offer help',
            spans: [],
          },
        ],
        text: [],
        columns: '3',
        items: [
          {
            icon: 'feather',
            title: 'Help with anxiety',
            text: para(
              "If you're constantly overthinking, feeling restless, or stuck in cycles of fear, I offer evidence-based therapy to help manage and reduce anxiety, so you can regain peace of mind."
            ),
            link: noLink(),
          },
          {
            icon: 'sun',
            title: 'How to deal with depression',
            text: para(
              "Depression can feel heavy and isolating. Therapy can help you understand what's happening emotionally, reconnect with your strengths, and feel hopeful again."
            ),
            link: noLink(),
          },
          {
            icon: 'heart',
            title: 'Marriage problems therapy',
            text: para(
              'I support clients who are experiencing conflict, communication issues, or emotional disconnection. Together, we can work toward rebuilding trust and intimacy.'
            ),
            link: noLink(),
          },
          {
            icon: 'shield',
            title: 'Coping with trauma',
            text: para(
              'Whether from past abuse, accidents, or emotional distress, I offer a therapeutic approach that can help you process and move forward with strength and resilience.'
            ),
            link: noLink(),
          },
          {
            icon: 'briefcase',
            title: 'Stress counselling for professionals',
            text: para(
              "If you're in a high-pressure job or experiencing burnout, my counselling for professionals is designed to help you manage work-related stress and find balance in your life."
            ),
            link: noLink(),
          },
        ],
      }),
      slice('narrative', {
        eyebrow: 'Supervision',
        heading: [{ type: 'heading2', text: 'Looking for a supervisor?', spans: [] }],
        body: para(
          'Are you a Psychotherapist or Counsellor working in Jersey with adults or children over 11 looking for a supervisor? Perhaps you want to consider a different perspective, a new way of reflecting on your work and developing your practice.',
          'I am a qualified clinical supervisor having trained with [Terapia](https://terapia.co.uk/course/supervision-training/) on their UKCP approved Diploma in Child, Adolescent and Adult Psychotherapy and Counselling Supervision. I work with individual practitioners, and I am also available to work with agencies and support their counsellors. If you would like to meet and explore how we might work together please send me a message using my [contact form](/contact/).'
        ),
        image: roomSofa,
        layout: 'image-left',
        background: 'grey',
      }),
      ctaBook,
    ],
  },

  booking: {
    title: 'Booking a Session',
    description:
      'Book a free initial consultation with Christopher Journeaux, psychotherapist and counsellor in St Helier, Jersey. Sessions in person or via Google Meet.',
    slices: [
      slice('page_header', {
        eyebrow: 'Booking',
        heading: [{ type: 'heading1', text: 'Booking a Psychotherapy Session', spans: [] }],
        text: para(
          'I offer a free initial consultation to anyone wanting to explore Psychotherapy.'
        ),
      }),
      slice('narrative', {
        eyebrow: 'Your first session',
        heading: [{ type: 'heading2', text: 'How it works', spans: [] }],
        body: para(
          'The initial consultation is a chance for me to meet you and for you to express your needs and learn more about the therapeutic process. You can then decide if Psychotherapy with me is for you. Simply contact me directly by telephone or send an email to make that first session. I am available for sessions via Google Meet, so please indicate if this is your preferred method of contact.',
          'I am subject to ongoing clinical supervision by a Supervising Psychotherapist to support my work with adults and children.',
          'Please contact me to discuss the costs for individual Psychotherapy sessions.'
        ),
        image: roomChairs,
        layout: 'image-right',
        background: 'white',
      }),
      slice('feature_columns', {
        eyebrow: 'Three simple steps',
        heading: [{ type: 'heading2', text: 'Taking the first step', spans: [] }],
        text: [],
        background: 'grey',
        items: [
          {
            icon: 'phone',
            title: 'Get in touch',
            text: para(
              'Call 07797 736595, email christopher@thequietroom.co.uk or use the contact form.'
            ),
          },
          {
            icon: 'calendar',
            title: 'Free initial consultation',
            text: para(
              'We meet, in my therapy room in St Helier or via Google Meet, so you can express your needs and learn more about the therapeutic process.'
            ),
          },
          {
            icon: 'check',
            title: 'Decide together',
            text: para(
              'You then decide if psychotherapy with me is for you. Session costs are discussed at this stage.'
            ),
          },
        ],
      }),
      slice('cta_band', {
        heading: [{ type: 'heading2', text: 'Book your first appointment today', spans: [] }],
        text: para('I work hours that can match your life and work needs.'),
        primary_link: page('contact', 'Contact me'),
        secondary_link: web('tel:+447797736595', 'Call 07797 736595'),
      }),
    ],
  },

  links: {
    title: 'Links',
    description:
      'Practitioners from other fields recommended by Quiet Room Therapy, offering a different approach and a different focus.',
    slices: [
      slice('page_header', {
        eyebrow: 'Links',
        heading: [{ type: 'heading1', text: 'Other practitioners', spans: [] }],
        text: para(
          'I work as a client focused practitioner which means I understand the value of thinking about my clients holistically.'
        ),
      }),
      slice('practitioner_list', {
        eyebrow: 'In their own words',
        heading: [{ type: 'heading2', text: 'Practitioners from different fields', spans: [] }],
        text: para(
          'On this page I am putting together a short list of practitioners from different fields that can offer a different approach and often a different focus. Below, and in their own words, they explain a little of what they do. For more details visit them online or make contact direct.'
        ),
        items: [
          {
            name: 'Kinga Gutkowska',
            role: 'Certified EFT and Matrix Reimprinting practitioner',
            photo: img('images/kinga-gutkowska.jpg', 'Kinga Gutkowska', 169, 190),
            bio: para(
              "I'm a certified EFT (Emotional Freedom Tapping) and Matrix Reimprinting practitioner. I combine these two techniques to release negative emotions and explore the beliefs that are holding you back, whether you are aware of them or not, and actually change them. Once your beliefs change, your feelings, your behaviour, and what you experience in your life will change naturally and with ease.",
              'Both EFT and Matrix are effective for phobias, allergies, anxiety, depression, posttraumatic stress disorder, pain, limiting beliefs, grief, physical & emotional manifestations of stress, fears and many more. Emotional Freedom Technique (also known as EFT or simply tapping) is a powerful technique based on research showing that emotional trauma greatly contributes to disease. Clinical trials have shown that EFT tapping is able to rapidly reduce the emotional impact of memories and incidents that trigger emotional distress.',
              'If you would like to work with me on transforming your life, please send me an email or text/call.'
            ),
            email: 'kinga_gutkowska@yahoo.co.uk',
            phone: '07797 719470',
            website: noLink(),
          },
        ],
      }),
      slice('cta_band', {
        heading: [
          { type: 'heading2', text: 'Looking for psychotherapy or supervision?', spans: [] },
        ],
        text: para('I offer a free initial consultation, in person in St Helier or online.'),
        primary_link: page('contact', 'Contact me'),
        secondary_link: page('services', 'See my services'),
      }),
    ],
  },

  contact: {
    title: 'Contact',
    description:
      'Contact Christopher Journeaux, psychotherapist, counsellor and clinical supervisor at Quiet Room Therapy, Francis Street, St Helier, Jersey. Call 07797 736595.',
    slices: [
      slice('page_header', {
        eyebrow: 'Contact',
        heading: [{ type: 'heading1', text: 'Contact me', spans: [] }],
        text: para(
          'Professional psychotherapy and counselling services with an experienced, qualified therapist and supervisor. Book your appointment today.'
        ),
      }),
      slice('contact_details', {
        eyebrow: 'Contact details',
        heading: [{ type: 'heading2', text: 'Christopher Journeaux', spans: [] }],
        text: para('I am an adult and child psychotherapist, counsellor and clinical supervisor.'),
        address: para('Suite 4', 'Bourne House', 'Francis Street', 'St Helier', 'Jersey JE2 4QE'),
        phone: '07797 736595',
        email: 'christopher@thequietroom.co.uk',
        directions: para(
          'The therapy room is just off La Colomberie on Francis Street, a short walk from Green Street car park. Sessions are also available online via Google Meet. I work hours that can match your life and work needs.'
        ),
        show_form: true,
        form_heading: 'Send a message',
        success_message: 'Thank you for contacting me. I will be in touch shortly.',
      }),
    ],
  },

  'privacy-statement': {
    title: 'Privacy Statement',
    description:
      'How Quiet Room Therapy collects, uses and protects information about visitors to this website.',
    slices: [
      slice('page_header', {
        eyebrow: 'Privacy',
        heading: [{ type: 'heading1', text: 'Privacy Statement', spans: [] }],
        text: para(
          'This site is owned and operated by The Quiet Room Therapy. Your privacy on the Internet is of the utmost importance.'
        ),
      }),
      slice('narrative', {
        eyebrow: '',
        heading: [],
        body: rt(
          para(
            'Because I gather certain types of information about users, I want you to fully understand the terms and conditions surrounding the capture and use of that information. This privacy statement fully explains what information is gathered and how it is used and how it is protected.'
          ),
          h3('The information gathered and tracked'),
          para(
            'I am registered with the Data Protection Commissioner.',
            'thequietroom.co.uk gathers the following types of information about users:'
          ),
          h3('Information collected by the contact form'),
          para(
            'Name and email address. This information is collected for the purpose of contacting users with a view to responding to their queries. The information collected in this way is used for no purpose other than this and is held within the connected email account.'
          ),
          h3('Statistical information about traffic to the site'),
          para(
            "I use statistics software to track user traffic patterns throughout the site. However, I do not correlate this information with data about individual users. I do break down overall usage statistics according to where users linked are from, and about their browser type, by reading this information from the browser string (information contained in every user's browser). This information is used to improve the site and any linked promotion."
          ),
          h3('Sharing of information'),
          para(
            'I do not, and will not ever, share information about individual users with any third party, except where required to do so to comply with any applicable law or valid legal process or to protect the personal safety of users or the public.'
          ),
          h3('Access to information'),
          para(
            'Users are legally entitled to a copy of the information held about them at any time. I will be happy to provide this information at any time. Please contact me at [christopher@thequietroom.co.uk](mailto:christopher@thequietroom.co.uk) for details.',
            'If there are changes to this privacy policy, those changes will be posted on this page so that you are always aware of what information is collected and how it is used.',
            'If you have any questions about this privacy policy, please contact [christopher@thequietroom.co.uk](mailto:christopher@thequietroom.co.uk) for clarification.'
          )
        ),
        layout: 'prose',
        background: 'white',
      }),
    ],
  },
};
