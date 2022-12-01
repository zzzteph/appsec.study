<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTopicLeaderboardsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('topic_leaderboards', function (Blueprint $table) {
            $table->id();
			$table->foreignId('user_id')->constrained()      ->onUpdate('cascade')
      ->onDelete('cascade');
			$table->foreignId('topic_id')->constrained()      ->onUpdate('cascade')
      ->onDelete('cascade');
			$table->integer('score');
			$table->integer('timespend');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('topic_leaderboards');
    }
}
