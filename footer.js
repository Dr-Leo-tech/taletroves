 export function readerFooter(){
    const footerElement = document.querySelector('.js-footer');
    const footerhtml = `
    <footer>
      <p>© 2025 TaleTrove. <br><br>
      <a href="#">Privacy Policy</a> | <a href="#">Terms</a> | <a href="#">Contact</a>
      </p>
      <p>Follow us on <br>
        <a href="#">Twitter</a>,
        <a href="#">Facebook</a>,
        <a href="#">Instagram</a>
      </p>
    </footer>
    `;
    footerElement.innerHTML = footerhtml;
}