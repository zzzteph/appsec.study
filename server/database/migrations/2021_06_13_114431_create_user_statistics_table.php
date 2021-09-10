<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserStatisticsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_statistics', function (Blueprint $table) {
            $table->id();
			$table->foreignId('user_id')->constrained()->onDelete('cascade');;
			$table->integer('answers')->default(0);
			$table->integer('correct_answers')->default(0);
			$table->integer('labs_done')->default(0);
			$table->integer('labs_time_spend')->default(0);
			$table->integer('lessons_done')->default(0);
			$table->integer('score')->default(0);
			$table->integer('total_score')->default(0);
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
        Schema::dropIfExists('user_statistics');
    }
}
