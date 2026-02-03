/**
 * Predefined student task templates for college pilot (e.g. Parul University).
 * Used in PostTask for quick-start and in Home/marketing.
 */
export const STUDENT_TASK_TEMPLATES = [
  // Academic
  { title: 'Assignment completion', description: 'Need help completing an assignment (writing, research, or submission).', category: 'Academic', budget: 200, expectedDuration: 2 },
  { title: 'PPT / Report making', description: 'Need a presentation or report made for a subject (content + slides).', category: 'Academic', budget: 400, expectedDuration: 3 },
  { title: 'Lab record writing', description: 'Need lab record or practical file written/typed with diagrams.', category: 'Academic', budget: 300, expectedDuration: 2 },
  { title: 'Notes preparation', description: 'Need handwritten or digital notes prepared for a subject/topic.', category: 'Academic', budget: 250, expectedDuration: 2 },
  { title: 'Coding help', description: 'Need help with programming assignment, debugging, or small project.', category: 'Tech', budget: 500, expectedDuration: 2 },
  { title: 'Exam tutoring', description: 'Need someone to tutor or explain topics before an exam.', category: 'Academic', budget: 400, expectedDuration: 1 },
  // Hostel
  { title: 'Room cleaning', description: 'One-time room cleaning (sweep, mop, dusting).', category: 'Hostel', budget: 100, expectedDuration: 1 },
  { title: 'Laundry help', description: 'Help with washing, drying, or folding clothes.', category: 'Hostel', budget: 150, expectedDuration: 1 },
  { title: 'Room shifting', description: 'Help moving bags and belongings to another room or floor.', category: 'Hostel', budget: 200, expectedDuration: 1 },
  // Errands
  { title: 'Food pickup', description: 'Pick up food from canteen or nearby and deliver to room/hostel.', category: 'Errands', budget: 50, expectedDuration: 0.5 },
  { title: 'Stationery / medicine purchase', description: 'Buy and deliver stationery or medicines from market.', category: 'Errands', budget: 100, expectedDuration: 1 },
  // Tech
  { title: 'Laptop or software setup', description: 'Help installing OS, software, or fixing basic laptop issues.', category: 'Tech', budget: 300, expectedDuration: 1 },
  { title: 'Resume / portfolio help', description: 'Help with resume formatting, content, or simple portfolio site.', category: 'Tech', budget: 400, expectedDuration: 2 },
  // Events
  { title: 'Event volunteering', description: 'Volunteer for event setup, registration, or coordination.', category: 'Events', budget: 200, expectedDuration: 3 },
  { title: 'Basic design / editing', description: 'Poster, banner, or short video editing for college event.', category: 'Events', budget: 350, expectedDuration: 2 }
]
