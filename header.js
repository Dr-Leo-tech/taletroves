export function readerHeader(){
    const headerElement = document.querySelector('.js-header');
    const headerhtml = `
    <header>
      <div class="nav-container">
        <div class="logo-wrapper">
            <div class="magic-book">
                <div class="book-cover"></div>
                <div class="book-line"></div>
                <div class="sparkle sp-1">✦</div>
                <div class="sparkle sp-2">✦</div>
            </div>
            <span class="logo-text">Tale Trove</span>
        </div>

        <button class="openbtn js-openbtn">☰</button>
      </div>

      <div id="mySidebar" class="sidebar">
        <a href="javascript:void(0)" class="closebtn js-closebtn">×</a>
        <a href="home.html">Home</a>
        <a href="stories.html">Stories</a>
        <a href="dashboard.html">My Profile</a>
      </div>
    </header>
    `;

    headerElement.innerHTML = headerhtml;

    document.querySelector('.js-openbtn').addEventListener('click', function () {
       document.getElementById("mySidebar").style.width = "250px";
       document.getElementById("main").style.marginLeft = "250px";
    });
    document.querySelector('.js-closebtn').addEventListener('click', function () {
      document.getElementById("mySidebar").style.width = "0";
      document.getElementById("main").style.marginLeft= "0";
    });
}