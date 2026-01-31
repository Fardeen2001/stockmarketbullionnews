'use client';

export default function AdminStyle() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      body > nav,
      body > footer {
        display: none !important;
      }
    `}} />
  );
}
