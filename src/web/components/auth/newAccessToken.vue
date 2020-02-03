<template>
    <div>
        <div>
            Your token in going to expire in {{ time }} seconds.
        </div>
        <div>
            <button @click="getNewAccessToken">
                Keep me logged in
            </button>
            <button @click="logout">
                Log me out
            </button>
        </div>
    </div>
</template>

<script>
export default {
    data () {
        return {
            time: this.startFrom,
            isRunning: false,
            interval: null
        }
    },
    props: {
        startFrom: Number
    },
    methods: {
        getNewAccessToken () {
            console.log('getNewAccessToken')
        },
        logout () {
            console.log('logout')
        },
        toggleTimer() {
            if (this.isRunning) {
                clearInterval(this.interval);
                console.log('timer stops');
            } else {
                this.interval = setInterval(this.decrementTime, 1000);
            }
            this.isRunning = !this.isRunning
        },
        decrementTime() {
            this.time = parseInt(this.time) - 1;
        },
    },
    created() {
        console.log('created')
        this.toggleTimer()
    }
}
</script>