// To turn the social links back on once the accounts exist:
// delete the <!-- and --> around the "Follow us on" block below,
// then replace each "#" with the real account URL.
export function readerFooter(){
    const footerElement = document.querySelector('.js-footer');
    if (!footerElement) return;
    const year = new Date().getFullYear();
    const footerhtml = `
    <footer>
      <p>© ${year} TaleTrove. <br><br>
      <a href="about.html">About</a> | <a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms</a> | <a href="contact.html">Contact</a>
      </p>
      <!--
      <p>Follow us on <br>
        <a href="#">Twitter</a>,
        <a href="#">Facebook</a>,
        <a href="#">Instagram</a>
      </p>
      -->
    </footer>
    `;
    footerElement.innerHTML = footerhtml;
}
readerFooter();
