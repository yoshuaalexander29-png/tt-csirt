cat << 'CSS_EOF' >> src/styles/homepage.css

/* Dashboard Row Layout */
.dashboard-row {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 24px !important;
    width: calc(100% - (var(--page-gutter) * 2)) !important;
    max-width: var(--content-max) !important;
    margin: 0 auto 24px !important;
}
@media (min-width: 1081px) {
    .dashboard-row {
        grid-template-columns: 1.15fr 0.85fr !important; /* Advisories, Incidents */
        margin: 0 auto 32px !important;
    }
}

/* Ensure incident panel behaves like a content card */
.incidents-panel.content-card {
    display: flex !important;
    flex-direction: column !important;
}

/* Ensure services panel behaves like a content card */
.services.content-card {
    display: flex !important;
    flex-direction: column !important;
}

/* Restore the styling for partners-panel since we stripped some of it */
.partners-panel.content-card {
    display: flex !important;
    flex-direction: column !important;
    padding: 0 !important; /* Let the intro and list have their own padding */
}
CSS_EOF

npm run build
