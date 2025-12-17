document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      if (activitySelect) {
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      }

      // Populate activities list with safe DOM nodes and a participants list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Title
        const title = document.createElement("h4");
        title.textContent = name;

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;

        // Schedule
        const schedule = document.createElement("p");
        const scheduleStrong = document.createElement("strong");
        scheduleStrong.textContent = "Schedule:";
        schedule.appendChild(scheduleStrong);
        schedule.appendChild(document.createTextNode(` ${details.schedule}`));

        // Availability
        const spotsLeft = details.max_participants - (details.participants?.length || 0);
        const avail = document.createElement("p");
        const availStrong = document.createElement("strong");
        availStrong.textContent = "Availability:";
        avail.appendChild(availStrong);
        avail.appendChild(document.createTextNode(` ${spotsLeft} spots left`));

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";
        const pTitle = document.createElement("h5");
        pTitle.textContent = "Participants";
        participantsDiv.appendChild(pTitle);

        const list = document.createElement("ul");
        const participants = details.participants || [];
        if (participants.length > 0) {
          participants.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p;
            // Create delete icon
            const deleteIcon = document.createElement('span');
            deleteIcon.textContent = '🗑️'; // Unicode for delete icon
            deleteIcon.className = 'delete-icon';
            deleteIcon.onclick = () => unregisterParticipant(p, name);
            list.appendChild(li);
            li.appendChild(deleteIcon);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          li.className = "muted";
          list.appendChild(li);
        }
        participantsDiv.appendChild(list);

        // Append everything to card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(avail);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Function to unregister participant
  async function unregisterParticipant(email, activityName = null) {
    try {
      // Ask the user to confirm
      if (!confirm(`Unregister ${email}?`)) return;

      // If activityName is not provided, try to determine it by searching the DOM
      if (!activityName) {
        const cards = Array.from(document.querySelectorAll('.activity-card'));
        for (const card of cards) {
          const lis = Array.from(card.querySelectorAll('li'));
          if (lis.some(li => li.firstChild && li.firstChild.nodeValue === email)) {
            const h4 = card.querySelector('h4');
            if (h4) {
              activityName = h4.textContent;
              break;
            }
          }
        }
      }

      if (!activityName) {
        alert('Could not determine activity for that participant.');
        return;
      }

      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      const result = await response.json();
      if (response.ok) {
        // Refresh activities list
        await fetchActivities();
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = result.message || 'Participant unregistered';
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
      } else {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error unregistering participant:', error);
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  }

  // Initialize app
  fetchActivities();
});
