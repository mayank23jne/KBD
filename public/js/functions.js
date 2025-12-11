function lockButtons(buttons) {
    buttons.lock.disabled = true;
    buttons.quit.disabled = true;
}

function unlockButtons(buttons) {
    buttons.lock.disabled = false;
    buttons.quit.disabled = false;
}

function lockLifelines(lifelines) {
    lifelines.audiencePoll.disabled = true;
    lifelines.fiftyFifty.disabled = true;
    lifelines.flipTheQuestion.disabled = true;
    lifelines.askTheExpert.disabled = true;
}

function unlockLifelines(lifelines) {
    lifelines.audiencePoll.disabled = false;
    lifelines.fiftyFifty.disabled = false;
    lifelines.flipTheQuestion.disabled = false;
    lifelines.askTheExpert.disabled = false;
}

function createChart(option1, option2, option3, option4) {
    Chart.defaults.global.defaultFontFamily = 'Poppins';
    Chart.defaults.global.defaultFontSize = 14;
    Chart.defaults.global.defaultFontColor = '#fff';

    const ctx = document.getElementById('chart').getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(240,176,0,1)');
    gradient.addColorStop(0.5, 'rgba(224,209,70,1)');
    gradient.addColorStop(1, 'rgba(240,176,0,1)');

    const dataArr = [option1, option2, option3, option4];
    const total = dataArr.reduce((a, b) => a + b, 0);

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['A', 'B', 'C', 'D'],
            datasets: [{
                label: 'Percentage',
                data: dataArr,
                backgroundColor: gradient
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Audience Poll',
                fontSize: 18
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: false  // Tooltip band kar do
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        min: 0,
                        max: 100,
                        stepSize: 25
                    }
                }],
                xAxes: [{
                    categorySpacing: 0.5,
                    barPercentage: 0.5,
                    gridLines: {
                        display: false
                    }
                }]
            },
            animation: {
                onComplete: function () {
                    drawLabels();
                },
                onProgress: function () {
                    drawLabels();
                }
            }
        }
    });

    // Ye function har bar text draw karega
    function drawLabels() {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffffffff';  // Dark color for visibility
        ctx.font = '10px Poppins';

        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index];
                const percentage = total ? ((value / total) * 100).toFixed(0) + '%' : '0%';
                ctx.fillText(percentage, bar._model.x, bar._model.y - 5);
            });
        });
    }
}


