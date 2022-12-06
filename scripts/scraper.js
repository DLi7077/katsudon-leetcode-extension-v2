// user clicks button
// expect loadingStyle
// when gone, look for fail or success
//   fail: some error exists
//   success: some time space text will show up

console.log("Loaded");

const classes = {
  sumbitButtonClass:
    "px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg",
  loadingRectClass: "animate-pulse flex w-full flex-col space-y-4",
};
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
  const intervalTick = 300; //ms
  const isLoading = () => {
    return !!document.getElementsByClassName(classes.loadingRectClass).length;
  };

  if (!awaitSubmissionInterval) {
    // wait for leetcode to process the solution (loading rectangles)
    awaitSubmissionInterval = setInterval(() => {
      if (!isLoading()) {
        clearInterval(awaitSubmissionInterval);
        awaitSubmissionInterval = null;
        return true;
      }
    }, intervalTick);
  }

  return false;
}

async function submissionLifeCycle(e) {
  if (!validateSubmit(e.target)) {
    console.log("not submit button");
    return;
  }
  if (!(await awaitSubmission())) {
    console.log("already processing");
    return;
  }
}

document.addEventListener("click", submissionLifeCycle);
