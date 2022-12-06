// user clicks button
// expect loadingStyle
// when gone, look for fail or success
//   fail: some error exists
//   success: some time space text will show up

console.log("Loaded");
const Utils = {
  get: (object, path) => {
    const chainedKeys = path.split(".");
    let result = object;
    for (const key of chainedKeys) {
      if (!result[key]) {
        console.log(`invalid key ${key}`);
        return null;
      }
      result = result[key];
    }

    return result;
  },
};

const classes = {
  sumbitButton:
    "px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg",
  loadingRect: "animate-pulse flex w-full flex-col space-y-4",
};
function validateSubmit(targetElement) {
  return targetElement.innerText === "Submit";
}

/**
 * @description Waits for leetcode to process the solution and calls the scraper after
 * @param {void} scrapeFunction The next function to call - the scraper
 * @returns nothing
 */
let awaitSubmissionInterval = null; // global submission status
async function awaitSubmission(scrapeFunction) {
  if (!!awaitSubmissionInterval) {
    console.warn("Katsudon: already submitting");
    return;
  }
  const intervalTick = 300; //ms
  const isLoading = () => {
    return !!document.getElementsByClassName(classes.loadingRect).length;
  };

  if (!awaitSubmissionInterval) {
    // wait for leetcode to process the solution (loading rectangles)
    awaitSubmissionInterval = setInterval(() => {
      if (!isLoading()) {
        clearInterval(awaitSubmissionInterval);
        awaitSubmissionInterval = null;
        scrapeFunction();
      }
    }, intervalTick);
  }
}

function retrieveSolutionFromLocalStorage(problemId, solutionLanguge) {
  const localStorageKeys = Object.keys(localStorage);
  const solutionRegex = new RegExp(`^${problemId}.+(?<!(updated-time))$`);

  // https://stackoverflow.com/a/43825436
  const solutionKey = localStorageKeys.find((key) => solutionRegex.test(key));
  return localStorage.getItem(solutionKey);
}

function scrapeSubmisison() {
  const scriptData = JSON.parse(
    document.getElementById("__NEXT_DATA__").innerText
  );
  const problemQuery = Utils.get(
    scriptData,
    "props.pageProps.dehydratedState.queries"
  )[0];
  const problemId = Utils.get(problemQuery, "state.data.question.questionId");

  // retrieve code submission from localStorage
  const solution = retrieveSolutionFromLocalStorage(problemId);
  console.log(solution)
  return solution;
}

async function submissionLifeCycle(e) {
  if (!validateSubmit(e.target)) {
    console.log("not submit button");
    return;
  }
  await awaitSubmission(scrapeSubmisison);
}

document.addEventListener("click", submissionLifeCycle);
