export const DEFAULT_SERVICE_CONFIG_YAML = `services:
  - id: photos
    url: https://photos.example.com
    aliases:
      - pictures
      - albums
    group: Media
    shortcut: "1"
    pinned: true
    tags:
      - media
      - family

  - id: notes
    name: Notes
    url: https://notes.example.com
    icon: notebook
    aliases:
      - docs
      - writing
    group: Knowledge
    shortcut: "2"
    pinned: true
    tags:
      - text
      - reference
`;
