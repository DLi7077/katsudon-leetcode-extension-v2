// user clicks button
// expect loadingStyle
// when gone, look for fail or success
//   fail: some error exists
//   success: some time space text will show up

console.log("Loaded");

const sumbitButtonClass =
  "px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg";

const loadingRectClass = "animate-pulse flex w-full flex-col space-y-4";

function validateSubmit(targetElement) {
  return targetElement.innerText === "Submit";
}

/**
 * @description Waits for leetcode to process the solution and calls the scraper after
 * @param {void} nextFunction The next function to call - the scraper
 * @returns nothing
 */

let awaitSubmissionInterval; // global submission status
async function awaitSubmission() {
  console.log("clicked");

  const isLoading = () => {
    console.log(document.getElementsByClassName(loadingRectClass));
    return !!document.getElementsByClassName(loadingRectClass).length;
  };

  const intervalTick = 300; //ms

  if (!awaitSubmissionInterval) {
    // wait for leetcode to process the solution (loading rectangles)
    awaitSubmissionInterval = setInterval(() => {
      if (!isLoading()) {
        console.log("processed");
        clearInterval(awaitSubmissionInterval);
        nIntervId = null;
        return true;
      }
    }, intervalTick);
  }
}

async function submissionLifeCycle(e) {
  if (!validateSubmit(e.target)) {
    console.log(e.target);
    console.log("not submit button");
    return;
  }
}

document.addEventListener("click", submissionLifeCycle);
